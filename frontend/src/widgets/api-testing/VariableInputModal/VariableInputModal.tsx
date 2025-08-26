import React, { useState, useEffect } from 'react';
import { TemplateVariable } from '../../../shared/utils/templateVariables';

interface VariableInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (variables: Record<string, string>) => void;
  variableNames?: string[];
  templateVariables?: TemplateVariable[];
  title?: string;
}

export const VariableInputModal: React.FC<VariableInputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  variableNames = [],
  templateVariables = [],
  title = "템플릿 변수 입력"
}) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [currentVariables, setCurrentVariables] = useState<TemplateVariable[]>([]);

  // 모달이 열릴 때만 초기화 (무한루프 방지)
  useEffect(() => {
    if (!isOpen) {
      // 모달이 닫힐 때 상태 초기화
      setVariables({});
      setCurrentVariables([]);
      return;
    }

    console.log('VariableInputModal useEffect triggered');
    console.log('templateVariables received:', templateVariables);
    console.log('variableNames received:', variableNames);

    // 사용할 변수 결정
    let varsToUse: TemplateVariable[] = [];
    if (templateVariables && templateVariables.length > 0) {
      varsToUse = templateVariables.filter(v => v && typeof v.name === 'string');
    } else if (variableNames && variableNames.length > 0) {
      // variableNames가 이미 TemplateVariable 객체 배열인 경우 처리
      varsToUse = variableNames.map(item => {
        if (typeof item === 'string') {
          return {
            name: item,
            value: '',
            defaultValue: undefined
          };
        } else if (typeof item === 'object' && item.name) {
          // 이미 TemplateVariable 객체인 경우
          return {
            name: item.name,
            value: item.value || '',
            defaultValue: item.defaultValue
          };
        } else {
          return {
            name: String(item),
            value: '',
            defaultValue: undefined
          };
        }
      });
    }

    console.log('Variables to use:', varsToUse);
    
    // 변수가 실제로 변경되었을 때만 업데이트 (무한루프 방지)
    if (JSON.stringify(currentVariables) !== JSON.stringify(varsToUse)) {
      setCurrentVariables(varsToUse);

      // 초기값 설정
      const initialVars: Record<string, string> = {};
      varsToUse.forEach(variable => {
        const defaultValue = variable.defaultValue || '';
        initialVars[variable.name] = defaultValue;
        console.log(`Setting ${variable.name} = "${defaultValue}"`);
      });
      
      console.log('Setting initial variables:', initialVars);
      setVariables(initialVars);
    }

  }, [isOpen]); // isOpen만 의존성으로 설정

  const handleInputChange = (variableName: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 값만 체크 (기본값이 없는 변수들)
    const requiredEmptyVariables: string[] = [];
    currentVariables.forEach(variable => {
      if (!variable.defaultValue && (!variables[variable.name] || !variables[variable.name].trim())) {
        requiredEmptyVariables.push(variable.name);
      }
    });
    
    if (requiredEmptyVariables.length > 0) {
      alert(`다음 변수들의 값을 입력해주세요: ${requiredEmptyVariables.join(', ')}`);
      return;
    }
    
    // 최종 변수 값 준비 - 빈 값일 때 기본값 사용
    const finalVariables: Record<string, string> = {};
    currentVariables.forEach(variable => {
      const currentValue = variables[variable.name];
      if (currentValue !== undefined && currentValue !== '') {
        finalVariables[variable.name] = currentValue;
      } else if (variable.defaultValue !== undefined) {
        finalVariables[variable.name] = variable.defaultValue;
      } else {
        finalVariables[variable.name] = '';
      }
    });
    
    console.log('Final variables to submit:', finalVariables);
    onConfirm(finalVariables);
  };

  const handleCancel = () => {
    setVariables({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-700 text-sm">
                  API에서 템플릿 변수 <code>{`{{변수명}}`}</code>가 발견되었습니다. 실제 값을 입력해주세요.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {currentVariables.map((variable, index) => {
                const currentValue = variables[variable.name] || '';
                console.log(`Rendering input for ${variable.name}, value:`, currentValue, 'defaultValue:', variable.defaultValue);
                
                return (
                  <div key={variable.name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {variable.defaultValue 
                          ? `{{${variable.name}:${variable.defaultValue}}}`
                          : `{{${variable.name}}}`
                        }
                      </code>
                      {variable.defaultValue && (
                        <span className="ml-2 text-xs text-gray-500">
                          (기본값: {variable.defaultValue})
                        </span>
                      )}
                    </label>
                  <input
                    type="text"
                    value={variables[variable.name] !== undefined ? variables[variable.name] : (variable.defaultValue || '')}
                    onChange={(e) => handleInputChange(variable.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      variable.defaultValue 
                        ? `${variable.name} 값을 입력하세요 (기본값: ${variable.defaultValue})`
                        : `${variable.name} 값을 입력하세요`
                    }
                    required={!variable.defaultValue}
                    onFocus={() => console.log(`Input focused: ${variable.name}, current value:`, variables[variable.name])}
                  />
                </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};