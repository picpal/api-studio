import React, { useState, useEffect, useRef } from 'react';

export interface ParamItem {
  key: string;
  value: string;
  description: string;
  required: boolean;
  id: string;
}

interface ParamsTableProps {
  paramsList: ParamItem[];
  onUpdateParam: (id: string, field: 'key' | 'value' | 'description' | 'required', value: string | boolean) => void;
  onRemoveParam: (id: string) => void;
  onAddParam: () => void;
}

const ParamsTable: React.FC<ParamsTableProps> = ({
  paramsList,
  onUpdateParam,
  onRemoveParam,
  onAddParam,
}) => {
  // 스크롤 상태
  const [isDesktopScrollable, setIsDesktopScrollable] = useState(false);
  const [isMobileScrollable, setIsMobileScrollable] = useState(false);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 가능 여부 체크
  useEffect(() => {
    const checkScrollable = () => {
      // 데스크톱 스크롤 체크
      if (desktopScrollRef.current) {
        const { scrollHeight, clientHeight } = desktopScrollRef.current;
        setIsDesktopScrollable(scrollHeight > clientHeight);
      }
      
      // 모바일 스크롤 체크
      if (mobileScrollRef.current) {
        const { scrollHeight, clientHeight } = mobileScrollRef.current;
        setIsMobileScrollable(scrollHeight > clientHeight);
      }
    };

    checkScrollable();
    
    const resizeObserver = new ResizeObserver(checkScrollable);
    if (desktopScrollRef.current) {
      resizeObserver.observe(desktopScrollRef.current);
    }
    if (mobileScrollRef.current) {
      resizeObserver.observe(mobileScrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [paramsList]);
  return (
    <div>
      {/* Desktop Table Layout */}
      <div className="hidden md:block relative">
        <div 
          ref={desktopScrollRef}
          className="overflow-y-auto" 
          style={{maxHeight: 'calc(100vh - 430px)', minHeight: '250px'}}
        >
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-300 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300 w-12">
                <span className="cursor-help" title="Required parameter">Must</span>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '40%'}}>
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '30%'}}>
                Key
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '30%'}}>
                Value
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 w-10">
                Del
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {paramsList.map((param) => (
              <tr key={param.id} className="hover:bg-gray-50 border-b border-gray-300">
                <td className="px-3 py-2 border-r border-gray-300">
                  <div className="flex items-center justify-center h-full">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={param.required}
                        onChange={(e) => onUpdateParam(param.id, 'required', e.target.checked)}
                      />
                      <div className="relative w-4 h-4 bg-white border border-gray-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-hover:border-blue-400 transition-colors duration-200">
                        <svg
                          className={`absolute inset-0 w-2.5 h-2.5 m-0.5 text-white transition-opacity duration-200 ${
                            param.required ? 'opacity-100' : 'opacity-0'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </label>
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <input
                    className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                    placeholder="description"
                    value={param.description}
                    onChange={(e) => onUpdateParam(param.id, 'description', e.target.value)}
                    data-param-id={param.id}
                    data-field="description"
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <input
                    className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                    placeholder="key"
                    value={param.key}
                    onChange={(e) => onUpdateParam(param.id, 'key', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <input
                    className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                    placeholder="value"
                    value={param.value}
                    onChange={(e) => onUpdateParam(param.id, 'value', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onRemoveParam(param.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors duration-200 text-sm w-6 h-6 flex items-center justify-center mx-auto rounded hover:bg-red-50"
                    title="Del"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {/* Add Parameter Row */}
            <tr className="bg-gray-50">
              <td colSpan={5} className="px-3 py-3 border-t border-gray-300">
                <button
                  onClick={onAddParam}
                  className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
                  title="Add Parameter"
                  data-add-param-button
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Parameter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        
        {/* 하단 그라이데이션 - 데스크톱 */}
        {isDesktopScrollable && (
          <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>

      {/* Mobile Table Layout */}
      <div className="md:hidden relative">
        <div 
          ref={mobileScrollRef}
          className="overflow-y-auto" 
          style={{maxHeight: 'calc(100vh - 480px)', minHeight: '250px'}}
        >
        <div className="bg-gray-50 border-b border-gray-300 sticky top-0 z-10">
          <div className="flex text-xs font-medium text-gray-600">
            <div className="px-3 py-2 border-r border-gray-300" style={{width: '40%'}}>Description</div>
            <div className="px-3 py-2 text-center border-r border-gray-300" style={{width: '30%'}}>Key</div>
            <div className="px-3 py-2 text-center border-r border-gray-300" style={{width: '30%'}}>Value</div>
            <div className="w-12 px-3 py-2 text-center">Del</div>
          </div>
        </div>
        <div className="bg-white">
          {paramsList.map((param) => (
            <div key={param.id} className="flex items-center border-b border-gray-300">
              <div className="px-3 py-2 border-r border-gray-300" style={{width: '40%'}}>
                <input
                  className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                  placeholder="Description"
                  value={param.description}
                  onChange={(e) => onUpdateParam(param.id, 'description', e.target.value)}
                  data-param-id={param.id}
                  data-field="description"
                />
              </div>
              <div className="px-3 py-2 border-r border-gray-300" style={{width: '30%'}}>
                <input
                  className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded text-center"
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) => onUpdateParam(param.id, 'key', e.target.value)}
                />
              </div>
              <div className="px-3 py-2 border-r border-gray-300" style={{width: '30%'}}>
                <input
                  className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded text-center"
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) => onUpdateParam(param.id, 'value', e.target.value)}
                />
              </div>
              <div className="w-12 px-3 py-2 flex justify-center">
                <button
                  onClick={() => onRemoveParam(param.id)}
                  className="text-gray-400 hover:text-red-600 text-sm transition-colors duration-200 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                  title="Del"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {/* Add Parameter Row for Mobile */}
          <div className="bg-gray-50 px-3 py-3">
            <button
              onClick={onAddParam}
              className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
              title="Add Parameter"
              data-add-param-button
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Parameter
            </button>
          </div>
        </div>
        </div>
        
        {/* 하단 그라이데이션 - 모바일 */}
        {isMobileScrollable && (
          <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>
    </div>
  );
};

export default ParamsTable;