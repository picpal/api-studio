import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  // 레이지 로딩 상태
  const [displayCount, setDisplayCount] = useState(30); // 최초 30개
  const [isLoading, setIsLoading] = useState(false);
  
  // 스크롤 상태
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 표시할 히스토리 항목들 (최신순으로 정렬 후 제한)
  const displayedHistory = useMemo(() => {
    return [...batchHistory]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, displayCount);
  }, [batchHistory, displayCount]);

  const hasMoreItems = batchHistory.length > displayCount;

  // 더 보기 핸들러
  const loadMoreItems = async () => {
    if (isLoading || !hasMoreItems) return;
    
    setIsLoading(true);
    // 실제 로딩 효과를 위한 짧은 지연
    await new Promise(resolve => setTimeout(resolve, 300));
    setDisplayCount(prev => prev + 20); // 20개씩 추가
    setIsLoading(false);
  };

  // 스크롤 이벤트 핸들러 (디바운스 적용)
  const handleScroll = () => {
    if (!scrollRef.current || isLoading || !hasMoreItems) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px 여유로 더 일찍 로딩
    
    if (scrolledToBottom) {
      loadMoreItems();
    }
  };

  // 스크롤 가능 여부 체크
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        setIsScrollable(scrollHeight > clientHeight);
      }
    };

    checkScrollable();
    
    const resizeObserver = new ResizeObserver(checkScrollable);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [displayedHistory]);

  // 새로운 테스트 실행 시에만 맨 위로 스크롤하고 displayCount는 유지
  useEffect(() => {
    if (batchHistory.length > 0 && scrollRef.current) {
      // 새로운 히스토리가 추가되면 맨 위로 스크롤
      const isNewHistoryAdded = batchHistory.length > displayedHistory.length;
      if (isNewHistoryAdded) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [batchHistory.length]);
  return (
    <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l bg-white flex flex-col lg:min-h-0">
      <div className="p-4 border-b lg:flex-shrink-0">
        <h3 className="text-md py-2 font-semibold">Test History</h3>
      </div>
      {batchHistory.length > 0 ? (
        <div className="lg:flex-1 lg:min-h-0 max-h-96 lg:max-h-none relative">
          <div 
            ref={scrollRef}
            className="overflow-y-auto p-4 h-full"
            onScroll={handleScroll}
          >
          <div className="space-y-2">
            {displayedHistory.map(batch => (
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
            
            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="flex justify-center items-center p-4">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">Loading more...</span>
                </div>
              </div>
            )}
            
            {/* 더 보기 버튼 (스크롤이 아닌 경우 대안) */}
            {!isLoading && hasMoreItems && (
              <div className="flex justify-center p-4">
                <button
                  onClick={loadMoreItems}
                  className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                >
                  Load More ({batchHistory.length - displayCount} remaining)
                </button>
              </div>
            )}
          </div>
          </div>
          
          {/* 하단 그라이데이션 */}
          {isScrollable && !isLoading && hasMoreItems && (
            <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent" />
          )}
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