// UI Testing 메인 콘텐츠 영역 (파일 업로드 및 실행 관리)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CloudArrowUpIcon,
  TrashIcon,
  CodeBracketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { UiTestScript, UiTestFile, UiTestExecution } from '../../entities/ui-testing/types';
import { uiTestScriptApi, uiTestFileApi, uiTestExecutionApi } from '../../shared/api/ui-testing';
import { useUiTestWebSocket } from '../../features/ui-testing/hooks/useUiTestWebSocket';
import PlaywrightGuide from '../../features/ui-testing/components/PlaywrightGuide';

interface UiTestingMainContentProps {
  selectedScript: UiTestScript | null;
  onResetForm: () => void;
  onUpdateSelectedScript: (updatedScript: Partial<UiTestScript>) => void;
}

const UiTestingMainContent: React.FC<UiTestingMainContentProps> = ({
  selectedScript,
  onResetForm,
  onUpdateSelectedScript
}) => {
  const [executing, setExecuting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UiTestFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showExecutionDetails, setShowExecutionDetails] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedFilesRef = useRef<UiTestFile[]>([]);

  // uploadedFiles 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  // WebSocket 업데이트 핸들러
  const handleWebSocketUpdate = useCallback((update: {
    fileId: number;
    status: UiTestFile['status'];
    result: string;
    timestamp: number;
  }) => {
    console.log('Processing WebSocket update:', update);
    setUploadedFiles(prev => prev.map(file =>
      file.id === update.fileId
        ? { ...file, status: update.status, lastExecutionResult: update.result }
        : file
    ));
  }, []);

  // WebSocket 구독
  useUiTestWebSocket(handleWebSocketUpdate);

  // 선택된 스크립트 로드
  useEffect(() => {
    if (selectedScript) {
      loadUploadedFiles(selectedScript.id);
    } else {
      setUploadedFiles([]);
    }
  }, [selectedScript]);

  const loadUploadedFiles = async (scriptId: number) => {
    try {
      const files = await uiTestFileApi.getFilesByScript(scriptId);
      setUploadedFiles(files);
    } catch (error) {
      console.error('Failed to load uploaded files:', error);
    }
  };

  const handleExecuteFile = async (fileId: number) => {
    if (!selectedScript) return;

    setExecuting(true);
    try {
      // 파일 실행 (Backend에서 WebSocket으로 RUNNING 상태 브로드캐스트)
      const result = await uiTestFileApi.execute(fileId);
      console.log('Execution started:', result);
      // WebSocket이 상태를 업데이트할 것임
    } catch (error) {
      console.error('Failed to execute file:', error);
      alert('파일 실행에 실패했습니다');
      // Backend가 실패를 처리하고 WebSocket으로 FAILED 상태 브로드캐스트
    } finally {
      setExecuting(false);
    }
  };

  const handleStopFile = async (fileId: number) => {
    try {
      await uiTestFileApi.stop(fileId);
      console.log(`File ${fileId} execution stopped`);
      // WebSocket이 상태를 업데이트할 것임
    } catch (error) {
      console.error('Failed to stop file:', error);
      alert('파일 실행 중지에 실패했습니다');
    }
  };

  const handleStopAll = async () => {
    if (!selectedScript) return;

    try {
      const result = await uiTestFileApi.stopAll(selectedScript.id);
      console.log('All files stopped:', result);
      // 페이지 새로고침으로 최신 상태 가져오기
      await loadUploadedFiles(selectedScript.id);
    } catch (error) {
      console.error('Failed to stop all files:', error);
      alert('모든 파일 실행 중지에 실패했습니다');
    }
  };

  const handleExecuteAll = async () => {
    if (!selectedScript || uploadedFiles.length === 0) return;

    setExecuting(true);

    // 동시 실행 개수 제한 (Runner 서버 리소스 고려)
    const maxConcurrency = 3;
    const chunks: UiTestFile[][] = [];

    // 파일들을 청크로 나누기
    for (let i = 0; i < uploadedFiles.length; i += maxConcurrency) {
      chunks.push(uploadedFiles.slice(i, i + maxConcurrency));
    }

    console.log(`Executing ${uploadedFiles.length} files in ${chunks.length} batches (max ${maxConcurrency} concurrent)`);

    // 각 청크를 병렬로 실행
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.log(`Starting batch ${chunkIndex + 1}/${chunks.length} with ${chunk.length} files`);

      try {
        // 청크 내 모든 파일을 병렬 실행
        await Promise.all(
          chunk.map(async (file) => {
            try {
              // 파일 실행 (Backend에서 WebSocket으로 RUNNING 상태 브로드캐스트)
              const result = await uiTestFileApi.execute(file.id);
              console.log(`Execution started for file ${file.id} (${file.fileName}):`, result);

              // 해당 파일의 실행이 완료될 때까지 대기 (WebSocket 콜백 대기)
              await waitForExecutionComplete(file.id);
              console.log(`Execution completed for file ${file.id} (${file.fileName})`);

            } catch (error) {
              console.error(`Failed to execute file ${file.id} (${file.fileName}):`, error);
              // Backend가 실패를 처리하고 WebSocket으로 FAILED 상태 브로드캐스트
            }
          })
        );

        // 다음 청크 실행 전 잠시 대기 (서버 부하 방지)
        if (chunkIndex < chunks.length - 1) {
          console.log(`Waiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Batch ${chunkIndex + 1} execution error:`, error);
      }
    }

    console.log('All files execution completed');
    setExecuting(false);
  };

  // 파일 실행 완료 대기 함수 (WebSocket 업데이트를 폴링으로 확인)
  const waitForExecutionComplete = (fileId: number): Promise<void> => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // CRITICAL: ref를 사용해야 최신 상태를 읽을 수 있음 (closure 문제 해결)
        const file = uploadedFilesRef.current.find(f => f.id === fileId);
        if (file && (file.status === 'COMPLETED' || file.status === 'FAILED')) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500); // 500ms마다 상태 확인

      // 최대 5분 대기 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn(`Execution timeout for file ${fileId}`);
        resolve();
      }, 300000); // 5분
    });
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await uiTestFileApi.delete(fileId);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('파일 삭제에 실패했습니다');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files));
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!selectedScript) {
      alert('먼저 스크립트를 선택해주세요');
      return;
    }

    for (const file of files) {
      // 파일 확장자 검증
      const allowedExtensions = ['.js', '.ts', '.spec.js', '.spec.ts', '.test.js', '.test.ts'];
      const fileExtension = file.name.toLowerCase();
      const isValid = allowedExtensions.some(ext => fileExtension.endsWith(ext));

      if (!isValid) {
        alert(`JavaScript/TypeScript 테스트 파일만 업로드 가능합니다 (.js, .ts, .spec.js, .spec.ts, .test.js, .test.ts): ${file.name}`);
        continue;
      }

      try {
        // 파일 업로드 API 호출
        const uploadedFile = await uiTestFileApi.uploadFile(selectedScript.id, file);

        // 업로드된 파일을 목록에 추가
        setUploadedFiles(prev => [...prev, uploadedFile]);
      } catch (error) {
        console.error('Failed to upload file:', error);
        const detail = error instanceof Error ? error.message : String(error);
        alert(`파일 업로드에 실패했습니다: ${file.name}\n${detail}`);
      }
    }

    // 파일 input 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = (status: UiTestFile['status']) => {
    switch (status) {
      case 'RUNNING':
        return <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: UiTestFile['status']) => {
    switch (status) {
      case 'RUNNING':
        return 'text-yellow-600 bg-yellow-100';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  // Parse execution result to extract meaningful data
  const parseExecutionResult = (resultString: string | null | undefined) => {
    if (!resultString) {
      return {
        status: 'Unknown',
        output: 'No execution result available',
        formattedOutput: 'No execution result available',
        testsPassed: 0,
        testsFailed: 0,
        testsSkipped: 0,
        duration: 0,
        testDetails: []
      };
    }

    try {
      // Try to parse as Playwright JSON output
      const jsonMatch = resultString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);

        // Use stats for accurate counts (더 정확함)
        const testsPassed = jsonData.stats?.expected || 0;
        const testsFailed = jsonData.stats?.unexpected || 0;
        const testsSkipped = jsonData.stats?.skipped || 0;
        const duration = jsonData.stats?.duration || 0;

        // Extract detailed test information
        const testDetails: any[] = [];
        if (jsonData.suites && Array.isArray(jsonData.suites)) {
          jsonData.suites.forEach((suite: any) => {
            if (suite.specs && Array.isArray(suite.specs)) {
              suite.specs.forEach((spec: any) => {
                if (spec.tests && Array.isArray(spec.tests)) {
                  spec.tests.forEach((test: any) => {
                    if (test.results && Array.isArray(test.results)) {
                      test.results.forEach((result: any) => {
                        testDetails.push({
                          title: spec.title,
                          status: result.status,
                          duration: result.duration,
                          stdout: result.stdout || [],
                          stderr: result.stderr || [],
                          errors: result.errors || []
                        });
                      });
                    }
                  });
                }
              });
            }
          });
        }

        // Format output for display
        let formattedOutput = '';
        testDetails.forEach((detail: any) => {
          const icon = detail.status === 'passed' ? '✓' :
                       detail.status === 'failed' ? '✗' :
                       '○';
          const color = detail.status === 'passed' ? 'PASS' :
                        detail.status === 'failed' ? 'FAIL' :
                        'SKIP';
          formattedOutput += `${icon} ${detail.title} - ${color} (${(detail.duration / 1000).toFixed(2)}s)\n`;

          // Add stdout
          if (detail.stdout && detail.stdout.length > 0) {
            formattedOutput += '\n  Output:\n';
            detail.stdout.forEach((out: any) => {
              if (out.text) {
                formattedOutput += `    ${out.text}`;
              }
            });
          }

          // Add errors
          if (detail.errors && detail.errors.length > 0) {
            formattedOutput += '\n  Errors:\n';
            detail.errors.forEach((err: any) => {
              formattedOutput += `    ${err.message || JSON.stringify(err)}\n`;
            });
          }

          formattedOutput += '\n';
        });

        formattedOutput += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        formattedOutput += `Summary: ${testsPassed} passed, ${testsFailed} failed, ${testsSkipped} skipped\n`;
        formattedOutput += `Total duration: ${(duration / 1000).toFixed(2)}s\n`;

        return {
          status: testsFailed > 0 ? 'Failed' : 'Completed',
          output: resultString,
          formattedOutput,
          testsPassed,
          testsFailed,
          testsSkipped,
          duration,
          testDetails
        };
      }
    } catch (e) {
      console.error('Failed to parse execution result:', e);
    }

    // Fallback: return raw string
    return {
      status: resultString.includes('error') || resultString.includes('Error') ? 'Failed' : 'Completed',
      output: resultString,
      formattedOutput: resultString,
      testsPassed: 0,
      testsFailed: 0,
      testsSkipped: 0,
      duration: 0,
      testDetails: []
    };
  };

  if (!selectedScript) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <DocumentTextIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No script selected</h3>
        <p className="text-sm text-gray-500">
          Select a script from the sidebar to manage and execute test files.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{selectedScript.name}</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadUploadedFiles(selectedScript.id)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              title="Refresh file list"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            {/* Stop All Button - only show when files are running */}
            {uploadedFiles.some(f => f.status === 'RUNNING') && (
              <button
                onClick={handleStopAll}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <StopIcon className="w-4 h-4 mr-2" />
                Stop All
              </button>
            )}
            <button
              onClick={handleExecuteAll}
              disabled={executing || uploadedFiles.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Run All ({uploadedFiles.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* File Upload Area */}
        <div className="flex-1 px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Files
            </label>

            {/* Upload Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">
                  Drop your test files here, or{' '}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports: .js, .ts, .spec.js, .spec.ts, .test.js, .test.ts
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".js,.ts,.spec.js,.spec.ts,.test.js,.test.ts"
                multiple
                onChange={handleFileInputChange}
              />
            </div>

            {/* Playwright Codegen Guide */}
            <PlaywrightGuide />

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{file.fileName}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(file.status)}`}>
                              {file.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {(file.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(file.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Execute Button */}
                        {file.status !== 'RUNNING' && (
                          <button
                            onClick={() => handleExecuteFile(file.id)}
                            disabled={executing}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            <PlayIcon className="w-3 h-3 mr-1" />
                            Run
                          </button>
                        )}

                        {/* Stop Button - only show when RUNNING */}
                        {file.status === 'RUNNING' && (
                          <button
                            onClick={() => handleStopFile(file.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                          >
                            <StopIcon className="w-3 h-3 mr-1" />
                            Stop
                          </button>
                        )}

                        {/* View Results Button */}
                        {file.lastExecutionResult && (
                          <button
                            onClick={() => setShowExecutionDetails(file.id === showExecutionDetails ? null : file.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 bg-gray-200 hover:bg-gray-300"
                          >
                            <EyeIcon className="w-3 h-3 mr-1" />
                            Results
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Details Modal */}
            {showExecutionDetails && (() => {
              const selectedFile = uploadedFiles.find(f => f.id === showExecutionDetails);
              if (!selectedFile) return null;

              const parsedResult = parseExecutionResult(selectedFile.lastExecutionResult);

              return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-2/3 max-w-4xl max-h-2/3 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Execution Results - {selectedFile.fileName}</h3>
                      <button
                        onClick={() => setShowExecutionDetails(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircleIcon className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Status:</span>
                          <span className={`ml-2 text-sm font-medium ${
                            selectedFile.status === 'COMPLETED' ? 'text-green-600' :
                            selectedFile.status === 'FAILED' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {selectedFile.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Duration:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {parsedResult.duration > 0 ? `${(parsedResult.duration / 1000).toFixed(2)}s` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Total Tests:</span>
                          <span className="ml-2 text-sm text-gray-900 font-medium">
                            {parsedResult.testsPassed + parsedResult.testsFailed + parsedResult.testsSkipped}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Passed:</span>
                          <span className="ml-2 text-sm text-green-600 font-medium">{parsedResult.testsPassed}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Failed:</span>
                          <span className="ml-2 text-sm text-red-600 font-medium">{parsedResult.testsFailed}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Skipped:</span>
                          <span className="ml-2 text-sm text-gray-500 font-medium">{parsedResult.testsSkipped}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Raw Output:</span>
                        <pre className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-auto max-h-96 font-mono whitespace-pre-wrap break-words border border-gray-200">
                          {parsedResult.output}
                        </pre>
                      </div>

                      {selectedFile.lastExecutedAt && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            Executed at: {new Date(selectedFile.lastExecutedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UiTestingMainContent;
