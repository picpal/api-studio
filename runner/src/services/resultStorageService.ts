import fs from 'fs-extra';
import path from 'path';
import { TestExecutionResult } from '../types';
import { Logger } from '../utils/logger';

export interface StoredExecutionResult extends TestExecutionResult {
  executionId: string;
  detailedOutput?: string;
  htmlReport?: string;
  screenshots?: string[];
  videoPath?: string;
  traces?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ResultStorageService {
  private resultsDir: string;

  constructor() {
    this.resultsDir = path.join(process.cwd(), 'uploads', 'results');
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.ensureDir(this.resultsDir);
      await fs.ensureDir(path.join(this.resultsDir, 'screenshots'));
      await fs.ensureDir(path.join(this.resultsDir, 'videos'));
      await fs.ensureDir(path.join(this.resultsDir, 'traces'));
      await fs.ensureDir(path.join(this.resultsDir, 'reports'));
      Logger.info('Result storage initialized');
    } catch (error) {
      Logger.error('Failed to initialize result storage', error);
    }
  }

  async saveExecutionResult(result: TestExecutionResult): Promise<StoredExecutionResult> {
    try {
      // 새 결과 저장 전에 같은 fileName의 이전 결과 삭제 (실행 성공 후 정리)
      if (result.fileName) {
        try {
          const deletedCount = await this.deleteResultsByFileName(result.fileName);
          if (deletedCount > 0) {
            Logger.info(`Cleaned up ${deletedCount} previous result(s) for file: ${result.fileName}`);
          }
        } catch (error) {
          Logger.warn(`Failed to cleanup previous results for ${result.fileName}, continuing...`, error);
          // 정리 실패해도 새 결과는 저장
        }
      }

      const executionId = `${result.scriptId}_${Date.now()}`;
      const storedResult: StoredExecutionResult = {
        ...result,
        executionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // JSON 결과 파일 저장
      const resultFilePath = path.join(this.resultsDir, `${executionId}.json`);
      await fs.writeJSON(resultFilePath, storedResult, { spaces: 2 });

      // HTML 상세 리포트 생성 및 저장
      if (result.output) {
        const htmlReport = this.generateHtmlReport(storedResult);
        const htmlPath = path.join(this.resultsDir, 'reports', `${executionId}.html`);
        await fs.writeFile(htmlPath, htmlReport);
        storedResult.htmlReport = htmlPath;
      }

      Logger.info(`Execution result saved: ${executionId}`);
      return storedResult;

    } catch (error) {
      Logger.error('Failed to save execution result', error);
      throw error;
    }
  }

  async getExecutionResult(executionId: string): Promise<StoredExecutionResult | null> {
    try {
      const resultFilePath = path.join(this.resultsDir, `${executionId}.json`);

      if (await fs.pathExists(resultFilePath)) {
        const result = await fs.readJSON(resultFilePath);
        return result as StoredExecutionResult;
      }

      return null;
    } catch (error) {
      Logger.error(`Failed to get execution result: ${executionId}`, error);
      return null;
    }
  }

  async getExecutionHistory(scriptId?: string, limit: number = 50): Promise<StoredExecutionResult[]> {
    try {
      const files = await fs.readdir(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const results: StoredExecutionResult[] = [];

      for (const file of jsonFiles) {
        try {
          const result = await fs.readJSON(path.join(this.resultsDir, file));
          if (!scriptId || result.scriptId === scriptId) {
            results.push(result);
          }
        } catch (error) {
          Logger.warn(`Failed to read result file: ${file}`, error);
        }
      }

      // 최신 순으로 정렬
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return results.slice(0, limit);

    } catch (error) {
      Logger.error('Failed to get execution history', error);
      return [];
    }
  }

  async deleteExecutionResult(executionId: string): Promise<boolean> {
    try {
      const resultFilePath = path.join(this.resultsDir, `${executionId}.json`);
      const htmlPath = path.join(this.resultsDir, 'reports', `${executionId}.html`);

      if (await fs.pathExists(resultFilePath)) {
        await fs.remove(resultFilePath);
      }

      if (await fs.pathExists(htmlPath)) {
        await fs.remove(htmlPath);
      }

      Logger.info(`Execution result deleted: ${executionId}`);
      return true;

    } catch (error) {
      Logger.error(`Failed to delete execution result: ${executionId}`, error);
      return false;
    }
  }

  /**
   * 파일명으로 모든 결과 삭제 (테스트 파일 삭제 시 사용)
   */
  async deleteResultsByFileName(fileName: string): Promise<number> {
    try {
      const files = await fs.readdir(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      let deletedCount = 0;

      for (const file of jsonFiles) {
        try {
          const result = await fs.readJSON(path.join(this.resultsDir, file)) as StoredExecutionResult;

          if (result.fileName === fileName) {
            await this.deleteExecutionResult(result.executionId);
            deletedCount++;
            Logger.info(`Deleted result for file ${fileName}: ${result.executionId}`);
          }
        } catch (error) {
          Logger.warn(`Failed to process file: ${file}`, error);
        }
      }

      Logger.info(`Deleted ${deletedCount} results for file: ${fileName}`);
      return deletedCount;

    } catch (error) {
      Logger.error(`Failed to delete results for file: ${fileName}`, error);
      return 0;
    }
  }

  async getExecutionStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    recentExecutions: StoredExecutionResult[];
  }> {
    try {
      const history = await this.getExecutionHistory();

      const stats = {
        total: history.length,
        successful: history.filter(r => r.status === 'completed').length,
        failed: history.filter(r => r.status === 'failed').length,
        recentExecutions: history.slice(0, 10)
      };

      return stats;

    } catch (error) {
      Logger.error('Failed to get execution stats', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        recentExecutions: []
      };
    }
  }

  private generateHtmlReport(result: StoredExecutionResult): string {
    const statusColor = result.status === 'completed' ? '#28a745' :
                       result.status === 'failed' ? '#dc3545' : '#ffc107';

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>테스트 실행 결과 - ${result.fileName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { padding: 20px; border-bottom: 1px solid #e9ecef; }
        .title { margin: 0; color: #212529; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; color: white; background: ${statusColor}; }
        .content { padding: 20px; }
        .section { margin-bottom: 30px; }
        .section h3 { color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .info-item { padding: 15px; background: #f8f9fa; border-radius: 6px; }
        .info-label { font-weight: 600; color: #6c757d; font-size: 12px; text-transform: uppercase; }
        .info-value { margin-top: 4px; color: #212529; }
        .output { background: #212529; color: #f8f9fa; padding: 20px; border-radius: 6px; font-family: 'Monaco', 'Menlo', monospace; font-size: 14px; white-space: pre-wrap; overflow-x: auto; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">테스트 실행 결과</h1>
            <p style="margin: 10px 0 0 0; color: #6c757d;">${result.fileName}</p>
        </div>

        <div class="content">
            <div class="section">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">실행 상태</div>
                        <div class="info-value">
                            <span class="status">${result.status.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">실행 시간</div>
                        <div class="info-value">${result.duration ? `${result.duration}ms` : 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">시작 시간</div>
                        <div class="info-value">${new Date(result.startTime).toLocaleString('ko-KR')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">종료 시간</div>
                        <div class="info-value">${result.endTime ? new Date(result.endTime).toLocaleString('ko-KR') : 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">스크립트 ID</div>
                        <div class="info-value">${result.scriptId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">실행 ID</div>
                        <div class="info-value">${result.executionId}</div>
                    </div>
                </div>
            </div>

            ${result.output ? `
            <div class="section">
                <h3>실행 로그</h3>
                <div class="output">${result.output}</div>
            </div>
            ` : ''}

            ${result.error ? `
            <div class="section">
                <h3>에러 정보</h3>
                <div class="error">${result.error}</div>
            </div>
            ` : ''}

            ${result.screenshots && result.screenshots.length > 0 ? `
            <div class="section">
                <h3>실패 지점 스크린샷</h3>
                <div class="screenshots">
                    ${result.screenshots.map((screenshot, index) => {
                      const fileName = path.basename(screenshot);
                      return `
                        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                            <p style="font-size: 14px; color: #666; margin: 0 0 10px 0; font-weight: 600;">스크린샷 ${index + 1}: ${fileName}</p>
                            <img src="/api/results/${result.executionId}/screenshot/${fileName}"
                                 alt="실패 지점 스크린샷"
                                 style="max-width: 100%; border: 2px solid #dc3545; border-radius: 4px; box-shadow: 0 2px 8px rgba(220,53,69,0.2);">
                        </div>
                      `;
                    }).join('')}
                </div>
            </div>
            ` : ''}

            ${result.traces && result.traces.length > 0 ? `
            <div class="section">
                <h3>트레이스 파일</h3>
                <div class="traces">
                    ${result.traces.map((trace, index) => {
                      const fileName = path.basename(trace);
                      return `
                        <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                            <a href="/api/results/${result.executionId}/trace/${fileName}"
                               style="color: #1976d2; text-decoration: none; font-weight: 500;">
                               📁 트레이스 ${index + 1}: ${fileName}
                            </a>
                        </div>
                      `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}