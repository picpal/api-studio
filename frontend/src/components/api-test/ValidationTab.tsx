import React from 'react';

export interface ExpectedValue {
  key: string;
  value: string;
  id: string;
}

interface ValidationTabProps {
  validationEnabled: boolean;
  expectedValuesList: ExpectedValue[];
  onToggleValidation: (enabled: boolean) => void;
  onUpdateExpectedValue: (index: number, field: 'key' | 'value', value: string) => void;
  onRemoveExpectedValue: (index: number) => void;
  onAddExpectedValue: () => void;
}

const ValidationTab: React.FC<ValidationTabProps> = ({
  validationEnabled,
  expectedValuesList,
  onToggleValidation,
  onUpdateExpectedValue,
  onRemoveExpectedValue,
  onAddExpectedValue,
}) => {
  return (
    <div className="overflow-y-auto" style={{maxHeight: 'calc(100vh - 500px)', minHeight: '240px'}}>
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="validationEnabled"
            checked={validationEnabled}
            onChange={(e) => onToggleValidation(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="validationEnabled" className="text-sm font-medium text-gray-700">
            Enable Response Validation
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-6">
          API 응답에서 지정한 키-값 쌍이 일치하는지 검증합니다
        </p>
      </div>

      {validationEnabled && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Expected Values</h4>
          <div className="grid grid-cols-12 gap-2 mb-3 text-xs font-medium text-gray-600">
            <div className="col-span-5">Key (JSON path)</div>
            <div className="col-span-6">Expected Value</div>
            <div className="col-span-1 text-center">Del</div>
          </div>
          
          <div className="space-y-2">
            {expectedValuesList.map((expectedValue, index) => (
              <div key={expectedValue.id} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="e.g., status, data.code, result.success"
                  value={expectedValue.key}
                  onChange={(e) => onUpdateExpectedValue(index, 'key', e.target.value)}
                  className="col-span-5 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Expected value"
                  value={expectedValue.value}
                  onChange={(e) => onUpdateExpectedValue(index, 'value', e.target.value)}
                  className="col-span-6 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => onRemoveExpectedValue(index)}
                  disabled={expectedValuesList.length === 1}
                  className="col-span-1 text-center text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={onAddExpectedValue}
              className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
              title="Add Expected Value"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Expected Value
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm font-medium text-yellow-800 mb-1">사용법:</div>
            <div className="text-xs text-yellow-700">
              • <strong>성공 응답(200-299)에 대해서만</strong> 유효성 검증을 수행합니다<br/>
              • Key에는 JSON 경로를 입력하세요 (예: "status", "data.code", "result.items.0.name")<br/>
              • 중첩된 객체는 점(.)으로 구분하고, 배열 인덱스는 숫자로 표현하세요<br/>
              • Expected Value에는 예상되는 값을 정확히 입력하세요<br/>
              • 4xx, 5xx 에러 응답은 자동으로 실패 처리되므로 별도 검증하지 않습니다
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationTab;