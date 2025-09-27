import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/logger';
import { ResultStorageService } from '../services/resultStorageService';

export class ResultController {
  private resultStorage: ResultStorageService;

  constructor() {
    this.resultStorage = new ResultStorageService();
  }

  async getExecutionResult(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      if (!executionId) {
        res.status(400).json({
          error: 'Missing executionId parameter'
        });
        return;
      }

      const result = await this.resultStorage.getExecutionResult(executionId);

      if (!result) {
        res.status(404).json({
          error: 'Execution result not found',
          executionId
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      Logger.error('Error in getExecutionResult endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { scriptId, limit } = req.query;

      const historyLimit = limit ? parseInt(limit as string) : 50;
      const history = await this.resultStorage.getExecutionHistory(
        scriptId as string,
        historyLimit
      );

      res.status(200).json({
        success: true,
        data: history,
        count: history.length
      });

    } catch (error) {
      Logger.error('Error in getExecutionHistory endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getExecutionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.resultStorage.getExecutionStats();

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      Logger.error('Error in getExecutionStats endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async deleteExecutionResult(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      if (!executionId) {
        res.status(400).json({
          error: 'Missing executionId parameter'
        });
        return;
      }

      const deleted = await this.resultStorage.deleteExecutionResult(executionId);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Execution result deleted successfully',
          executionId
        });
      } else {
        res.status(404).json({
          error: 'Execution result not found',
          executionId
        });
      }

    } catch (error) {
      Logger.error('Error in deleteExecutionResult endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getScreenshot(req: Request, res: Response): Promise<void> {
    try {
      const { executionId, fileName } = req.params;

      if (!executionId || !fileName) {
        res.status(400).json({
          error: 'Missing executionId or fileName parameter'
        });
        return;
      }

      const screenshotPath = path.join(
        process.cwd(),
        'uploads',
        'results',
        'assets',
        executionId.split('_')[0],
        fileName
      );

      if (await fs.pathExists(screenshotPath)) {
        res.sendFile(screenshotPath);
      } else {
        res.status(404).json({
          error: 'Screenshot not found',
          path: fileName
        });
      }

    } catch (error) {
      Logger.error('Error in getScreenshot endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getTrace(req: Request, res: Response): Promise<void> {
    try {
      const { executionId, fileName } = req.params;

      if (!executionId || !fileName) {
        res.status(400).json({
          error: 'Missing executionId or fileName parameter'
        });
        return;
      }

      const tracePath = path.join(
        process.cwd(),
        'uploads',
        'results',
        'assets',
        executionId.split('_')[0],
        fileName
      );

      if (await fs.pathExists(tracePath)) {
        res.download(tracePath);
      } else {
        res.status(404).json({
          error: 'Trace file not found',
          path: fileName
        });
      }

    } catch (error) {
      Logger.error('Error in getTrace endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}