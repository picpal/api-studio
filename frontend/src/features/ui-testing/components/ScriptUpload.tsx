// 스크립트 파일 업로드 컴포넌트

import React, { useState, useRef } from 'react';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { uiTestScriptApi, uiTestFileApi } from '../../../shared/api/ui-testing';

interface ScriptUploadProps {
  folderId?: number;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
}

const ScriptUpload: React.FC<ScriptUploadProps> = ({
  folderId,
  onUploadSuccess,
  onUploadError
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // 파일 확장자 검증
    const allowedExtensions = ['.js', '.ts', '.spec.js', '.spec.ts', '.test.js', '.test.ts'];
    const fileExtension = file.name.toLowerCase();
    const isValid = allowedExtensions.some(ext => fileExtension.endsWith(ext));

    if (!isValid) {
      onUploadError?.('Only JavaScript/TypeScript test files are allowed (.js, .ts, .spec.js, .spec.ts, .test.js, .test.ts)');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Step 1: Create a new script with the file name (without extension)
      const scriptName = selectedFile.name.replace(/\.(js|ts|spec\.js|spec\.ts|test\.js|test\.ts)$/, '');
      const newScript = await uiTestScriptApi.create({
        name: scriptName,
        description: `Uploaded from file: ${selectedFile.name}`,
        scriptContent: '',
        scriptType: 'PLAYWRIGHT',
        browserType: 'CHROMIUM',
        timeoutSeconds: 30,
        headlessMode: true,
        screenshotOnFailure: true,
        folderId: folderId
      });

      // Step 2: Upload the file to the newly created script
      await uiTestFileApi.uploadFile(newScript.id, selectedFile);

      setSelectedFile(null);
      onUploadSuccess?.();
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
              Drop your test script here, or{' '}
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
            onChange={handleFileInputChange}
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={removeSelectedFile}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptUpload;