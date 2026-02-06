import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Logger } from '../utils/logger';
import { ResultStorageService } from './resultStorageService';
import {
  TestExecutionRequest,
  TestExecutionResult,
  PlaywrightOptions,
  BatchExecutionRequest,
  BatchExecutionResult
} from '../types';

// M3: 하드코딩 값 상수 추출
const DEFAULT_EXPECT_TIMEOUT = 10000;
const DEFAULT_ACTION_TIMEOUT = 15000;
const DEFAULT_NAVIGATION_TIMEOUT = 30000;
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const DEFAULT_LOCALE = 'ko-KR';
const DEFAULT_TIMEZONE = 'Asia/Seoul';

export class PlaywrightService {
  private runningTests: Map<string, { process: any; scriptId: string }> = new Map();
  private onProgressCallback?: (result: TestExecutionResult) => void;
  private resultStorage: ResultStorageService = new ResultStorageService();

  setProgressCallback(callback: (result: TestExecutionResult) => void): void {
    this.onProgressCallback = callback;
  }

  async executeScript(request: TestExecutionRequest): Promise<TestExecutionResult> {
    const startTime = new Date();
    const executionId = uuidv4();
    const result: TestExecutionResult = {
      scriptId: request.scriptId,
      fileName: request.fileName,
      status: 'running',
      startTime,
    };

    try {
      Logger.info(`Starting execution of script: ${request.fileName} (executionId: ${executionId})`);

      if (!await fs.pathExists(request.scriptPath)) {
        throw new Error(`Script file not found: ${request.scriptPath}`);
      }

      this.notifyProgress(result);

      const output = await this.runPlaywrightScript(request, executionId);

      result.status = 'completed';
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();
      result.output = output;

      Logger.info(`Script execution completed: ${request.fileName}`);
      this.notifyProgress(result);

      // 실행 결과 저장 (스크린샷 및 트레이스 파일 포함)
      await this.collectAndSaveAssets(result, request);
      await this.resultStorage.saveExecutionResult(result);

      // 백엔드에 콜백
      if (request.callbackUrl) {
        Logger.info(`Sending callback to: ${request.callbackUrl}`);
        await this.sendCallback(request.callbackUrl, result);
      } else {
        Logger.warn('No callback URL provided');
      }

      return result;

    } catch (error) {
      result.status = 'failed';
      result.endTime = new Date();
      result.duration = result.endTime!.getTime() - startTime.getTime();
      result.error = error instanceof Error ? error.message : String(error);

      Logger.error(`Script execution failed: ${request.fileName}`, error);
      this.notifyProgress(result);

      // 실행 결과 저장 (실패한 경우도 저장 - 특히 스크린샷 중요)
      await this.collectAndSaveAssets(result, request);
      await this.resultStorage.saveExecutionResult(result);

      // 백엔드에 콜백 (실패한 경우도 알림)
      if (request.callbackUrl) {
        Logger.info(`Sending failure callback to: ${request.callbackUrl}`);
        await this.sendCallback(request.callbackUrl, result);
      } else {
        Logger.warn('No callback URL provided for failed execution');
      }

      return result;
    } finally {
      this.runningTests.delete(executionId);
    }
  }

  async executeBatch(request: BatchExecutionRequest): Promise<BatchExecutionResult> {
    const batchId = uuidv4();
    const results: TestExecutionResult[] = [];

    Logger.info(`Starting batch execution: ${request.scripts.length} scripts`);

    if (request.parallel) {
      const maxConcurrency = request.maxConcurrency || 3;
      const chunks = this.chunkArray(request.scripts, maxConcurrency);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(script => this.executeScript(script));
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
    } else {
      for (const script of request.scripts) {
        const result = await this.executeScript(script);
        results.push(result);
      }
    }

    const batchResult: BatchExecutionResult = {
      batchId,
      totalScripts: request.scripts.length,
      completedScripts: results.filter(r => r.status === 'completed').length,
      failedScripts: results.filter(r => r.status === 'failed').length,
      results
    };

    Logger.info(`Batch execution completed: ${batchResult.completedScripts}/${batchResult.totalScripts} successful`);

    return batchResult;
  }

  async cancelExecution(scriptId: string): Promise<boolean> {
    let cancelled = false;
    for (const [executionId, entry] of this.runningTests.entries()) {
      if (entry.scriptId === scriptId) {
        entry.process.kill('SIGTERM');
        this.runningTests.delete(executionId);
        Logger.info(`Cancelled execution: ${scriptId} (executionId: ${executionId})`);
        cancelled = true;
      }
    }
    return cancelled;
  }

  private buildPlaywrightConfig(
    scriptDir: string,
    scriptFileName: string,
    timeout: number,
    headless: boolean,
    options: PlaywrightOptions
  ): string {
    const browserName = options.browser || 'chromium';
    const viewport = options.viewport || DEFAULT_VIEWPORT;

    return `
/**
 * Temporary Playwright Configuration
 * Auto-generated for script: ${scriptFileName}
 * Generated at: ${new Date().toISOString()}
 */
module.exports = {
  testDir: ${JSON.stringify(scriptDir)},
  testMatch: [${JSON.stringify(scriptFileName)}],
  timeout: ${Number(timeout)},
  expect: {
    timeout: ${DEFAULT_EXPECT_TIMEOUT},
  },
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  outputDir: 'test-results',
  use: {
    headless: ${Boolean(headless)},
    viewport: { width: ${Number(viewport.width)}, height: ${Number(viewport.height)} },
    actionTimeout: ${DEFAULT_ACTION_TIMEOUT},
    navigationTimeout: ${DEFAULT_NAVIGATION_TIMEOUT},
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    locale: '${DEFAULT_LOCALE}',
    timezoneId: '${DEFAULT_TIMEZONE}',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: '${browserName}',
      use: {
        browserName: '${browserName}',
      },
    },
  ],
};
`;
  }

  private async runPlaywrightScript(request: TestExecutionRequest, executionId: string): Promise<string> {
    const options = request.options || {};
    const scriptPath = request.scriptPath;

    // Path Traversal 방지: scriptPath가 uploads/ 디렉토리 내부인지 검증
    const resolvedPath = path.resolve(scriptPath);
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!resolvedPath.startsWith(uploadsDir + path.sep)) {
      throw new Error('Script path is outside allowed directory');
    }

    const scriptDir = path.dirname(scriptPath);
    const scriptFileName = path.basename(scriptPath);

    // M1: uuidv4()로 파일명 고유성 보장
    const tempConfigPath = path.join(process.cwd(), `temp-playwright-config-${uuidv4()}.js`);

    Logger.info(`Creating temporary config for test: ${scriptFileName}`);
    Logger.info(`Test directory: ${scriptDir}`);

    const timeout = options.timeout || 60000;
    const headless = options.headless !== false;
    const configContent = this.buildPlaywrightConfig(scriptDir, scriptFileName, timeout, headless, options);

    try {
      await fs.writeFile(tempConfigPath, configContent, 'utf-8');
      Logger.info(`Temporary config created: ${tempConfigPath}`);

      return await this.spawnPlaywrightProcess(tempConfigPath, executionId, request.scriptId);
    } catch (error) {
      await this.cleanupTempConfig(tempConfigPath);
      throw error;
    }
  }

  private spawnPlaywrightProcess(tempConfigPath: string, executionId: string, scriptId: string): Promise<string> {
    const args = ['test', `--config=${tempConfigPath}`];

    return new Promise((resolve, reject) => {
      const playwrightProcess = spawn('npx', ['playwright', ...args], {
        cwd: process.cwd(),
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          NODE_PATH: path.join(process.cwd(), 'node_modules'),
        }
      });

      this.runningTests.set(executionId, { process: playwrightProcess, scriptId });

      let stdout = '';
      let stderr = '';
      let settled = false;

      playwrightProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        Logger.info(`Playwright stdout: ${output}`);
      });

      playwrightProcess.stderr?.on('data', (data) => {
        const errorOutput = data.toString();
        stderr += errorOutput;
        Logger.error(`Playwright stderr: ${errorOutput}`);
      });

      playwrightProcess.on('close', async (code) => {
        if (settled) return;
        settled = true;
        await this.cleanupTempConfig(tempConfigPath);

        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Playwright process exited with code ${code}\n${stderr}`));
        }
      });

      playwrightProcess.on('error', async (error) => {
        if (settled) return;
        settled = true;
        await this.cleanupTempConfig(tempConfigPath);
        reject(error);
      });
    });
  }

  private async cleanupTempConfig(configPath: string): Promise<void> {
    try {
      if (await fs.pathExists(configPath)) {
        await fs.remove(configPath);
        Logger.info(`Temporary config deleted: ${configPath}`);
      }
    } catch (error) {
      Logger.warn(`Failed to delete temporary config: ${configPath}`, error);
    }
  }

  private notifyProgress(result: TestExecutionResult): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(result);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getRunningTests(): string[] {
    return Array.from(this.runningTests.keys());
  }

  private async sendCallback(callbackUrl: string, result: TestExecutionResult): Promise<void> {
    try {
      await axios.post(callbackUrl, {
        status: result.status,
        result: result.output || result.error || '',
        duration: result.duration,
        startTime: result.startTime,
        endTime: result.endTime
      });
      Logger.info(`Callback sent to: ${callbackUrl}`);
    } catch (error) {
      Logger.error(`Failed to send callback to ${callbackUrl}`, error);
    }
  }

  private async collectAndSaveAssets(result: TestExecutionResult, request: TestExecutionRequest): Promise<void> {
    try {
      const testResultsDir = path.join(process.cwd(), 'test-results');
      const assetsDir = path.join(process.cwd(), 'uploads', 'results', 'assets', result.scriptId);

      await fs.ensureDir(assetsDir);

      // test-results 디렉토리 확인
      if (await fs.pathExists(testResultsDir)) {
        const files = await fs.readdir(testResultsDir, { recursive: true });

        const screenshots: string[] = [];
        const traces: string[] = [];

        for (const file of files) {
          const fullPath = path.join(testResultsDir, file as string);
          const stats = await fs.stat(fullPath);

          if (stats.isFile()) {
            const fileName = path.basename(file as string);

            // 스크린샷 파일 처리
            if (fileName.includes('screenshot') && (fileName.endsWith('.png') || fileName.endsWith('.jpg'))) {
              const newPath = path.join(assetsDir, `screenshot-${Date.now()}-${fileName}`);
              await fs.copy(fullPath, newPath);
              screenshots.push(newPath);
              Logger.info(`Screenshot saved: ${newPath}`);
            }

            // 트레이스 파일 처리
            if (fileName.includes('trace') && fileName.endsWith('.zip')) {
              const newPath = path.join(assetsDir, `trace-${Date.now()}-${fileName}`);
              await fs.copy(fullPath, newPath);
              traces.push(newPath);
              Logger.info(`Trace saved: ${newPath}`);
            }
          }
        }

        // 결과에 파일 경로 추가
        result.screenshots = screenshots;
        result.traces = traces;

        // test-results 디렉토리 정리
        await fs.remove(testResultsDir).catch(err => {
          Logger.warn('Failed to clean up test-results directory', err);
        });
      }

    } catch (error) {
      Logger.error('Failed to collect and save assets', error);
    }
  }
}