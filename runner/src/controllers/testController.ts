import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { PlaywrightService } from '../services/playwrightService';
import { WebSocketService } from '../services/websocketService';
import {
  TestExecutionRequest,
  BatchExecutionRequest,
  PlaywrightOptions
} from '../types';

export class TestController {
  constructor(
    private playwrightService: PlaywrightService,
    private websocketService: WebSocketService
  ) {
    this.playwrightService.setProgressCallback((result) => {
      switch (result.status) {
        case 'running':
          this.websocketService.broadcastExecutionStart(result);
          break;
        case 'completed':
          this.websocketService.broadcastExecutionComplete(result);
          break;
        case 'failed':
          this.websocketService.broadcastExecutionError(result);
          break;
        default:
          this.websocketService.broadcastExecutionProgress(result);
      }
    });
  }

  async executeScript(req: Request, res: Response): Promise<void> {
    try {
      const { scriptPath, fileName, options } = req.body as {
        scriptPath: string;
        fileName: string;
        options?: PlaywrightOptions;
      };

      if (!scriptPath || !fileName) {
        res.status(400).json({
          error: 'Missing required fields: scriptPath and fileName'
        });
        return;
      }

      const scriptId = uuidv4();
      const request: TestExecutionRequest = {
        scriptId,
        scriptPath: path.resolve(scriptPath),
        fileName,
        options: options || {}
      };

      Logger.info(`Received script execution request: ${fileName}`);

      this.playwrightService.executeScript(request)
        .then(result => {
          Logger.info(`Script execution finished: ${fileName} - ${result.status}`);
        })
        .catch(error => {
          Logger.error(`Script execution error: ${fileName}`, error);
        });

      res.status(202).json({
        message: 'Script execution started',
        scriptId,
        fileName
      });

    } catch (error) {
      Logger.error('Error in executeScript endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async executeBatch(req: Request, res: Response): Promise<void> {
    try {
      const { scripts, parallel = true, maxConcurrency = 3 } = req.body as BatchExecutionRequest;

      if (!scripts || !Array.isArray(scripts) || scripts.length === 0) {
        res.status(400).json({
          error: 'Missing or invalid scripts array'
        });
        return;
      }

      const enhancedScripts = scripts.map(script => ({
        ...script,
        scriptId: script.scriptId || uuidv4(),
        scriptPath: path.resolve(script.scriptPath)
      }));

      const batchRequest: BatchExecutionRequest = {
        scripts: enhancedScripts,
        parallel,
        maxConcurrency
      };

      Logger.info(`Received batch execution request: ${scripts.length} scripts`);

      this.playwrightService.executeBatch(batchRequest)
        .then(result => {
          Logger.info(`Batch execution finished: ${result.completedScripts}/${result.totalScripts} successful`);
        })
        .catch(error => {
          Logger.error('Batch execution error', error);
        });

      res.status(202).json({
        message: 'Batch execution started',
        totalScripts: scripts.length,
        parallel,
        maxConcurrency
      });

    } catch (error) {
      Logger.error('Error in executeBatch endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async cancelExecution(req: Request, res: Response): Promise<void> {
    try {
      const { scriptId } = req.params;

      if (!scriptId) {
        res.status(400).json({
          error: 'Missing scriptId parameter'
        });
        return;
      }

      const cancelled = await this.playwrightService.cancelExecution(scriptId);

      if (cancelled) {
        res.status(200).json({
          message: 'Script execution cancelled',
          scriptId
        });
      } else {
        res.status(404).json({
          error: 'Script execution not found or already completed',
          scriptId
        });
      }

    } catch (error) {
      Logger.error('Error in cancelExecution endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getRunningTests(req: Request, res: Response): Promise<void> {
    try {
      const runningTests = this.playwrightService.getRunningTests();

      res.status(200).json({
        runningTests,
        count: runningTests.length
      });

    } catch (error) {
      Logger.error('Error in getRunningTests endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async uploadScript(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'No file uploaded'
        });
        return;
      }

      const file = req.file;
      const allowedExtensions = ['.js', '.ts', '.mjs'];
      const fileExtension = path.extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        await fs.remove(file.path);
        res.status(400).json({
          error: 'Invalid file type. Only .js, .ts, and .mjs files are allowed'
        });
        return;
      }

      const scriptId = uuidv4();
      const fileName = `${scriptId}_${file.originalname}`;
      const uploadsDir = path.join(process.cwd(), 'uploads', 'scripts');
      const finalPath = path.join(uploadsDir, fileName);

      await fs.ensureDir(uploadsDir);
      await fs.move(file.path, finalPath);

      Logger.info(`Script uploaded successfully: ${file.originalname}`);

      res.status(200).json({
        message: 'Script uploaded successfully',
        scriptId,
        fileName: file.originalname,
        scriptPath: finalPath,
        size: file.size
      });

    } catch (error) {
      Logger.error('Error in uploadScript endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const runningTests = this.playwrightService.getRunningTests();
      const wsClients = this.websocketService.getConnectedClients();

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        runningTests: runningTests.length,
        wsClients,
        uptime: process.uptime()
      });

    } catch (error) {
      Logger.error('Error in healthCheck endpoint', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}