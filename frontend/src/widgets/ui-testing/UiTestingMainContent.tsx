// UI Testing 메인 콘텐츠 영역 (파일 업로드 및 실행 관리)

import React, { useState, useEffect, useRef } from 'react';
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
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { UiTestScript, UiTestExecution } from '../../entities/ui-testing/types';
import { uiTestScriptApi, uiTestExecutionApi } from '../../shared/api/ui-testing';

interface UiTestingMainContentProps {
  selectedScript: UiTestScript | null;
  onResetForm: () => void;
  onUpdateSelectedScript: (updatedScript: Partial<UiTestScript>) => void;
}

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'uploaded' | 'running' | 'completed' | 'failed';
  execution?: UiTestExecution;
}

const UiTestingMainContent: React.FC<UiTestingMainContentProps> = ({
  selectedScript,
  onResetForm,
  onUpdateSelectedScript
}) => {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showExecutionDetails, setShowExecutionDetails] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 선택된 스크립트 로드
  useEffect(() => {
    if (selectedScript) {
      setDescription(selectedScript.description || '');
      loadUploadedFiles(selectedScript.id);
    } else {
      resetForm();
    }
  }, [selectedScript]);

  const resetForm = () => {
    setDescription('');
    setUploadedFiles([]);
  };

  const loadUploadedFiles = async (scriptId: number) => {
    try {
      // 실제로는 업로드된 파일 목록을 가져오는 API 호출
      // 임시로 빈 배열로 설정
      setUploadedFiles([]);
    } catch (error) {
      console.error('Failed to load uploaded files:', error);
    }
  };

  const handleSaveScript = async () => {
    if (!selectedScript) return;

    setSaving(true);
    try {
      const updateData = { description };
      await uiTestScriptApi.update(selectedScript.id, updateData);
      onUpdateSelectedScript(updateData);
      alert('Script saved successfully!');
    } catch (error) {
      console.error('Failed to save script:', error);
      alert('Failed to save script');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteFile = async (fileId: number) => {
    if (!selectedScript) return;

    setExecuting(true);
    try {
      // 특정 파일 실행
      const result = await uiTestScriptApi.execute(selectedScript.id);
      console.log('Execution started:', result);

      // 파일 상태 업데이트
      setUploadedFiles(prev => prev.map(file =>
        file.id === fileId ? { ...file, status: 'running' } : file
      ));

      alert('File execution started!');
    } catch (error) {
      console.error('Failed to execute file:', error);
      alert('Failed to execute file');
    } finally {
      setExecuting(false);
    }
  };

  const handleDeleteFile = (fileId: number) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
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
      alert('Please select a script first');
      return;
    }

    for (const file of files) {
      // 파일 확장자 검증
      const allowedExtensions = ['.js', '.ts', '.spec.js', '.spec.ts', '.test.js', '.test.ts'];
      const fileExtension = file.name.toLowerCase();
      const isValid = allowedExtensions.some(ext => fileExtension.endsWith(ext));

      if (!isValid) {
        alert(`Only JavaScript/TypeScript test files are allowed (.js, .ts, .spec.js, .spec.ts, .test.js, .test.ts): ${file.name}`);
        continue;
      }

      try {
        // 파일 업로드 API 호출 (실제로는 uiTestScriptApi.uploadScript 사용)
        await uiTestScriptApi.uploadScript(file, selectedScript.folderId || undefined);

        // 업로드된 파일을 목록에 추가
        const newFile: UploadedFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          uploadedAt: new Date(),
          status: 'uploaded'
        };

        setUploadedFiles(prev => [...prev, newFile]);
      } catch (error) {
        console.error('Failed to upload file:', error);
        const detail = error instanceof Error ? error.message : String(error);
        alert(`Failed to upload file: ${file.name}\n${detail}`);
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

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'running':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'running':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
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
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{selectedScript.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedScript.folderName && `${selectedScript.folderName} / `}
              Created by {selectedScript.createdBy}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveScript}
              disabled={saving}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Script Description */}
        <div className="border-b border-gray-200 px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this test script does..."
            className="w-full h-20 p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{file.name}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(file.status)}`}>
                              {file.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB • Uploaded {file.uploadedAt.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Execute Button */}
                        <button
                          onClick={() => handleExecuteFile(file.id)}
                          disabled={file.status === 'running' || executing}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <PlayIcon className="w-3 h-3 mr-1" />
                          Run
                        </button>

                        {/* View Results Button */}
                        {file.execution && (
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
            {showExecutionDetails && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-2/3 max-w-4xl max-h-2/3 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Execution Results</h3>
                    <button
                      onClick={() => setShowExecutionDetails(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className="ml-2 text-sm text-gray-900">Completed</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Duration:</span>
                        <span className="ml-2 text-sm text-gray-900">2.5s</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tests Passed:</span>
                        <span className="ml-2 text-sm text-green-600">3</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tests Failed:</span>
                        <span className="ml-2 text-sm text-red-600">0</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Output:</span>
                      <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
{`✓ example test should load homepage
✓ example test should click button
✓ example test should fill form

3 passed (2.5s)`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UiTestingMainContent;
