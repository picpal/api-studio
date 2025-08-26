import React, { useState, useEffect } from 'react';
import { Pipeline } from '@/entities/pipeline';

interface EditPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePipeline: (pipelineId: number, data: { name: string; description: string }) => Promise<void>;
  pipeline: Pipeline | null;
  loading?: boolean;
}

export const EditPipelineModal: React.FC<EditPipelineModalProps> = ({
  isOpen,
  onClose,
  onUpdatePipeline,
  pipeline,
  loading
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // pipeline 데이터로 폼 초기화
  useEffect(() => {
    if (pipeline && isOpen) {
      setName(pipeline.name);
      setDescription(pipeline.description);
    }
  }, [pipeline, isOpen]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleUpdate = async () => {
    if (!name.trim() || !pipeline || isUpdating) return;

    setIsUpdating(true);
    try {
      await onUpdatePipeline(pipeline.id, {
        name: name.trim(),
        description: description.trim()
      });
      // 성공 시 모달 닫기
      onClose();
    } catch (error) {
      console.error('EditPipelineModal.handleUpdate: Error in onUpdatePipeline:', error);
      // 에러 발생 시에도 모달은 열어둠
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !pipeline) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">파이프라인 편집</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              파이프라인 이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="파이프라인 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="파이프라인에 대한 설명을 입력하세요"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleUpdate}
            disabled={!name.trim() || loading || isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading || isUpdating ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};