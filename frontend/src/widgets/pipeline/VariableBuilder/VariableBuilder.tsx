import React, { useState, useEffect } from 'react';

interface VariableRule {
  id: string;
  variableName: string;
  jsonPath: string;
}

interface VariableBuilderProps {
  title: string;
  type: 'extract' | 'inject';
  rules: VariableRule[];
  onRulesChange: (rules: VariableRule[]) => void;
  availableVariables?: string[];
  sampleResponse?: any;
  placeholder?: string;
}

export const VariableBuilder: React.FC<VariableBuilderProps> = ({
  title,
  type,
  rules,
  onRulesChange,
  availableVariables = [],
  sampleResponse,
  placeholder
}) => {
  const [showBuilder, setShowBuilder] = useState(false);

  const addRule = () => {
    const newRule: VariableRule = {
      id: Date.now().toString(),
      variableName: '',
      jsonPath: ''
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (id: string, field: keyof VariableRule, value: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    );
    onRulesChange(updatedRules);
  };

  const removeRule = (id: string) => {
    onRulesChange(rules.filter(rule => rule.id !== id));
  };

  // JSON 객체에서 가능한 경로들을 추출
  const extractPaths = (obj: any, prefix = '', paths: string[] = []): string[] => {
    if (!obj || typeof obj !== 'object') return paths;

    Object.keys(obj).forEach(key => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(currentPath);
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractPaths(obj[key], currentPath, paths);
      }
    });
    
    return paths;
  };

  const suggestedPaths = sampleResponse ? extractPaths(sampleResponse) : [];

  const getPathSuggestions = (input: string) => {
    if (type === 'extract') {
      return suggestedPaths.filter(path => 
        path.toLowerCase().includes(input.toLowerCase())
      );
    } else {
      // inject의 경우 일반적인 패턴들 제안
      const commonPaths = [
        'headers.Authorization',
        'headers.Content-Type',
        'body.userId',
        'body.id',
        'params.id',
        'params.userId'
      ];
      return commonPaths.filter(path => 
        path.toLowerCase().includes(input.toLowerCase())
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {title}
        </label>
        <button
          type="button"
          onClick={() => setShowBuilder(!showBuilder)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {showBuilder ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              간단 입력
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              고급 설정
            </>
          )}
        </button>
      </div>

      {showBuilder ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="space-y-3">
            {rules.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                아직 설정된 변수가 없습니다. 첫 번째 변수를 추가해보세요.
              </div>
            ) : (
              rules.map((rule) => (
                <VariableRuleEditor
                  key={rule.id}
                  rule={rule}
                  type={type}
                  onUpdate={updateRule}
                  onRemove={removeRule}
                  pathSuggestions={getPathSuggestions(rule.jsonPath)}
                  availableVariables={availableVariables}
                />
              ))
            )}
            
            <button
              type="button"
              onClick={addRule}
              className="w-full py-2 px-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              + 새 변수 추가
            </button>
          </div>
        </div>
      ) : (
        <textarea
          rows={3}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          readOnly
          value={JSON.stringify(
            rules.reduce((acc, rule) => ({
              ...acc,
              [rule.variableName]: rule.jsonPath
            }), {}),
            null,
            2
          )}
        />
      )}
    </div>
  );
};

interface VariableRuleEditorProps {
  rule: VariableRule;
  type: 'extract' | 'inject';
  onUpdate: (id: string, field: keyof VariableRule, value: string) => void;
  onRemove: (id: string) => void;
  pathSuggestions: string[];
  availableVariables: string[];
}

const VariableRuleEditor: React.FC<VariableRuleEditorProps> = ({
  rule,
  type,
  onUpdate,
  onRemove,
  pathSuggestions,
  availableVariables
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pathInput, setPathInput] = useState(rule.jsonPath);

  const handlePathChange = (value: string) => {
    setPathInput(value);
    onUpdate(rule.id, 'jsonPath', value);
    setShowSuggestions(value.length > 0);
  };

  const selectSuggestion = (suggestion: string) => {
    setPathInput(suggestion);
    onUpdate(rule.id, 'jsonPath', suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = pathSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(pathInput.toLowerCase())
  );

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-4">
        <input
          type="text"
          placeholder="변수명"
          value={rule.variableName}
          onChange={(e) => onUpdate(rule.id, 'variableName', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="col-span-7 relative">
        <input
          type="text"
          placeholder={type === 'extract' ? "response.data.token" : "headers.Authorization"}
          value={pathInput}
          onChange={(e) => handlePathChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {filteredSuggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="col-span-1">
        <button
          type="button"
          onClick={() => onRemove(rule.id)}
          className="p-2 text-red-400 hover:text-red-600"
          title="삭제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};