import { isPathAllowed, getAllowedScriptDirs } from '../utils/pathValidation';
import path from 'path';

describe('pathValidation', () => {
  describe('isPathAllowed', () => {
    it('should return true when scriptPath is inside an allowed directory', () => {
      // Arrange
      const allowedDirs = ['/home/user/uploads'];
      const scriptPath = '/home/user/uploads/scripts/test.spec.js';

      // Act
      const result = isPathAllowed(scriptPath, allowedDirs);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when scriptPath is outside all allowed directories', () => {
      // Arrange
      const allowedDirs = ['/home/user/uploads'];
      const scriptPath = '/etc/passwd';

      // Act
      const result = isPathAllowed(scriptPath, allowedDirs);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when scriptPath contains path traversal (../)', () => {
      // Arrange
      const allowedDirs = ['/home/user/uploads'];
      const scriptPath = '/home/user/uploads/../../../etc/passwd';

      // Act
      const result = isPathAllowed(scriptPath, allowedDirs);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when allowedDirs is an empty array', () => {
      // Arrange
      const allowedDirs: string[] = [];
      const scriptPath = '/home/user/uploads/test.spec.js';

      // Act
      const result = isPathAllowed(scriptPath, allowedDirs);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for partial directory name match (e.g. /uploads-evil/ vs /uploads/)', () => {
      // Arrange
      const allowedDirs = ['/home/user/uploads'];
      const scriptPath = '/home/user/uploads-evil/malicious.spec.js';

      // Act
      const result = isPathAllowed(scriptPath, allowedDirs);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when scriptPath is null or empty string', () => {
      // Arrange
      const allowedDirs = ['/home/user/uploads'];

      // Act & Assert
      expect(isPathAllowed('', allowedDirs)).toBe(false);
      expect(isPathAllowed(null as unknown as string, allowedDirs)).toBe(false);
    });
  });

  describe('getAllowedScriptDirs', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should include the default "uploads" directory', () => {
      // Arrange
      delete process.env.ALLOWED_SCRIPT_DIRS;

      // Act
      const dirs = getAllowedScriptDirs();

      // Assert
      const uploadsDir = path.resolve('uploads');
      expect(dirs).toContain(uploadsDir);
    });

    it('should include the resolved absolute path of "../backend/uploads/ui-tests"', () => {
      // Arrange
      delete process.env.ALLOWED_SCRIPT_DIRS;

      // Act
      const dirs = getAllowedScriptDirs();

      // Assert
      const backendUploadsDir = path.resolve('../backend/uploads/ui-tests');
      expect(dirs).toContain(backendUploadsDir);
    });

    it('should parse ALLOWED_SCRIPT_DIRS environment variable (comma-separated)', () => {
      // Arrange
      process.env.ALLOWED_SCRIPT_DIRS = '/custom/dir1,/custom/dir2';

      // Act
      const dirs = getAllowedScriptDirs();

      // Assert
      expect(dirs).toContain('/custom/dir1');
      expect(dirs).toContain('/custom/dir2');
    });

    it('should return only default directories when ALLOWED_SCRIPT_DIRS is not set', () => {
      // Arrange
      delete process.env.ALLOWED_SCRIPT_DIRS;

      // Act
      const dirs = getAllowedScriptDirs();

      // Assert
      const uploadsDir = path.resolve('uploads');
      const backendUploadsDir = path.resolve('../backend/uploads/ui-tests');
      expect(dirs).toContain(uploadsDir);
      expect(dirs).toContain(backendUploadsDir);
      expect(dirs.length).toBeGreaterThanOrEqual(2);
    });

    it('should ignore empty strings and whitespace-only paths in environment variable', () => {
      // Arrange
      process.env.ALLOWED_SCRIPT_DIRS = '/valid/dir, , ,  ,/another/valid';

      // Act
      const dirs = getAllowedScriptDirs();

      // Assert
      expect(dirs).toContain('/valid/dir');
      expect(dirs).toContain('/another/valid');
      dirs.forEach((dir) => {
        expect(dir.trim()).not.toBe('');
      });
    });
  });
});
