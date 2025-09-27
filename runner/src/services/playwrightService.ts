import { execFile, spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { ResultStorageService } from './resultStorageService';
import {
  TestExecutionRequest,
  TestExecutionResult,
  PlaywrightOptions,
  BatchExecutionRequest,
  BatchExecutionResult
} from '../types';

export class PlaywrightService {
  private runningTests: Map<string, any> = new Map();
  private onProgressCallback?: (result: TestExecutionResult) => void;
  private resultStorage: ResultStorageService = new ResultStorageService();

  setProgressCallback(callback: (result: TestExecutionResult) => void): void {
    this.onProgressCallback = callback;
  }

  async executeScript(request: TestExecutionRequest): Promise<TestExecutionResult> {
    const startTime = new Date();
    const result: TestExecutionResult = {
      scriptId: request.scriptId,
      fileName: request.fileName,
      status: 'running',
      startTime,
    };

    try {
      Logger.info(`Starting execution of script: ${request.fileName}`);

      if (!await fs.pathExists(request.scriptPath)) {
        throw new Error(`Script file not found: ${request.scriptPath}`);
      }

      this.notifyProgress(result);

      const output = await this.runPlaywrightScript(request);

      result.status = 'completed';
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();
      result.output = output;

      Logger.info(`Script execution completed: ${request.fileName}`);
      this.notifyProgress(result);

      // 실행 결과 저장 (스크린샷 및 트레이스 파일 포함)
      await this.collectAndSaveAssets(result, request);
      await this.resultStorage.saveExecutionResult(result);

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

      return result;
    } finally {
      this.runningTests.delete(request.scriptId);
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
    const process = this.runningTests.get(scriptId);
    if (process) {
      process.kill('SIGTERM');
      this.runningTests.delete(scriptId);
      Logger.info(`Cancelled execution: ${scriptId}`);
      return true;
    }
    return false;
  }

  private async runPlaywrightScript(request: TestExecutionRequest): Promise<string> {
    const options = request.options || {};

    const args = [
      'test',
      request.scriptPath,
      '--reporter=json',
    ];

    if (options.headless === false) {
      args.push('--headed');
    }

    if (options.timeout) {
      args.push(`--timeout=${options.timeout}`);
    }

    return new Promise((resolve, reject) => {
      const playwrightProcess = spawn('npx', ['playwright', ...args], {
        cwd: process.cwd(),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      this.runningTests.set(request.scriptId, playwrightProcess);

      let stdout = '';
      let stderr = '';

      playwrightProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      playwrightProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      playwrightProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Playwright process exited with code ${code}\n${stderr}`));
        }
      });

      playwrightProcess.on('error', (error) => {
        reject(error);
      });
    });
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