// UI Testing 도메인 타입 정의

export interface UiTestFolder {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  children?: UiTestFolder[];
  scriptCount: number;
  subFolderCount: number;
  isExpanded?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UiTestScript {
  id: number;
  name: string;
  description?: string;
  scriptContent: string;
  scriptType: 'PLAYWRIGHT' | 'SELENIUM' | 'CYPRESS';
  browserType: 'CHROMIUM' | 'FIREFOX' | 'WEBKIT' | 'CHROME' | 'SAFARI';
  timeoutSeconds: number;
  headlessMode: boolean;
  screenshotOnFailure: boolean;
  folderId?: number;
  folderName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UiTestExecution {
  id: number;
  executionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  scriptId: number;
  scriptName: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalTests: number;
  errorMessage?: string;
  resultData?: string;
  screenshotPaths?: string[];
  browserLogs?: string;
  executedBy: string;
  createdAt: string;
}

export interface CreateUiTestFolderRequest {
  name: string;
  description?: string;
  parentId?: number;
}

export interface UpdateUiTestFolderRequest {
  name?: string;
  description?: string;
}

export interface CreateUiTestScriptRequest {
  name: string;
  description?: string;
  scriptContent: string;
  scriptType: UiTestScript['scriptType'];
  browserType: UiTestScript['browserType'];
  timeoutSeconds: number;
  headlessMode: boolean;
  screenshotOnFailure: boolean;
  folderId?: number;
}

export interface UpdateUiTestScriptRequest {
  name?: string;
  description?: string;
  scriptContent?: string;
  scriptType?: UiTestScript['scriptType'];
  browserType?: UiTestScript['browserType'];
  timeoutSeconds?: number;
  headlessMode?: boolean;
  screenshotOnFailure?: boolean;
  folderId?: number;
}

export interface ExecuteUiTestScriptRequest {
  scriptId: number;
}

export interface UiTestExecutionResult {
  executionId: string;
  status: string;
  message?: string;
}