import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pipeline } from '@/entities/pipeline';

interface PipelineHeaderProps {
  pipeline: Pipeline;
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({ pipeline }) => {
  const navigate = useNavigate();

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/scenario-management')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="시나리오 목록으로 돌아가기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{pipeline.name}</h1>
          </div>
          <p className="text-gray-600 mb-4">{pipeline.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{pipeline.stepCount}개 단계</span>
            <span>•</span>
            <span>생성일: {new Date(pipeline.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>수정일: {new Date(pipeline.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
            편집
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            실행
          </button>
        </div>
      </div>
    </div>
  );
};