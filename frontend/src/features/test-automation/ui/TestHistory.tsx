import React from 'react';
import { TestExecution } from './TestExecution';

export interface TestBatchResult {
  id: string;
  totalTests: number;
  successCount: number;
  failureCount: number;
  totalTime: number;
  executions: TestExecution[];
  createdAt: Date;
  savedId?: number; // DB에 저장된 ID
  name?: string; // 저장된 이름
  createdBy?: string; // 생성자
}

interface TestHistoryProps {
  batchHistory: TestBatchResult[];
  selectedBatch: TestBatchResult | null;
  onSelectHistory: (batch: TestBatchResult) => void;
}

export const TestHistory: React.FC<TestHistoryProps> = ({
  batchHistory,
  selectedBatch,
  onSelectHistory
}) => {
  return (
    <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l bg-white flex flex-col lg:min-h-0">
      <div className="p-4 border-b lg:flex-shrink-0">
        <h3 className="text-md py-2 font-semibold">Test History</h3>
      </div>
      {batchHistory.length > 0 ? (
        <div className="lg:flex-1 lg:overflow-y-auto p-4 lg:min-h-0 max-h-96 lg:max-h-none overflow-y-auto">
          <div className="space-y-2">
            {batchHistory.map(batch => (
              <div
                key={batch.id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedBatch?.id === batch.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onSelectHistory(batch)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium">
                    {batch.name || `Batch #${batch.id.split('-')[1]?.slice(-4)}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {batch.createdAt.toLocaleTimeString()}
                  </div>
                </div>
                {batch.createdBy && (
                  <div className="text-xs text-gray-400 mb-1">
                    by {batch.createdBy}
                  </div>
                )}
                <div className="text-sm space-y-1">
                  <div>Tests: {batch.totalTests}</div>
                  <div className="flex justify-between">
                    <span className="text-green-600">✅ {batch.successCount}</span>
                    <span className="text-red-600">❌ {batch.failureCount}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Time: {(batch.totalTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs">
                    Success Rate: {((batch.successCount / batch.totalTests) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="lg:flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500 text-sm">
            No test history yet
          </div>
        </div>
      )}
    </div>
  );
};