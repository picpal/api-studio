import express from 'express';
import cors from 'cors';
import http from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';

import { Logger } from './utils/logger';
import { PlaywrightService } from './services/playwrightService';
import { WebSocketService } from './services/websocketService';
import { TestController } from './controllers/testController';
import { ResultController } from './controllers/resultController';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.js', '.ts', '.mjs'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .js, .ts, and .mjs files are allowed'));
    }
  }
});

async function initializeServices() {
  await fs.ensureDir('uploads/scripts');
  await fs.ensureDir('uploads/temp');

  const playwrightService = new PlaywrightService();
  const websocketService = new WebSocketService(server);
  const testController = new TestController(playwrightService, websocketService);
  const resultController = new ResultController();

  app.get('/health', (req, res) => testController.healthCheck(req, res));

  app.post('/api/execute', (req, res) => testController.executeScript(req, res));

  app.post('/api/batch-execute', (req, res) => testController.executeBatch(req, res));

  app.delete('/api/execute/:scriptId', (req, res) => testController.cancelExecution(req, res));

  app.get('/api/running-tests', (req, res) => testController.getRunningTests(req, res));

  app.post('/api/upload', upload.single('script'), (req, res) => testController.uploadScript(req, res));

  // 결과 관리 API
  app.get('/api/results/stats', (req, res) => resultController.getExecutionStats(req, res));

  app.get('/api/results/history', (req, res) => resultController.getExecutionHistory(req, res));

  app.get('/api/results/:executionId', (req, res) => resultController.getExecutionResult(req, res));

  app.delete('/api/results/:executionId', (req, res) => resultController.deleteExecutionResult(req, res));

  // 파일명으로 결과 삭제 (테스트 파일 삭제 시 사용)
  app.delete('/api/results/by-filename/:fileName', (req, res) => resultController.deleteResultsByFileName(req, res));

  // 스크린샷 및 트레이스 파일 제공
  app.get('/api/results/:executionId/screenshot/:fileName', (req, res) => resultController.getScreenshot(req, res));

  app.get('/api/results/:executionId/trace/:fileName', (req, res) => resultController.getTrace(req, res));

  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    Logger.error('Unhandled error:', err);

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large. Maximum size is 5MB'
        });
      }
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl
    });
  });

  return { playwrightService, websocketService };
}

async function startServer() {
  try {
    await initializeServices();

    server.listen(PORT, () => {
      Logger.info(`🚀 UI Test Runner Server started on port ${PORT}`);
      Logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      Logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
      Logger.info(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
      Logger.info(`⚡ Execute endpoint: http://localhost:${PORT}/api/execute`);
      Logger.info(`📦 Batch execute: http://localhost:${PORT}/api/batch-execute`);
    });

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

function gracefulShutdown() {
  Logger.info('Received shutdown signal. Gracefully shutting down...');

  server.close(() => {
    Logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    Logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

startServer();