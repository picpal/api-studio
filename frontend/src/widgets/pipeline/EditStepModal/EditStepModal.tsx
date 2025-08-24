import React, { useState, useEffect } from 'react';
import { PipelineStep, ApiItem, CreateStepRequest } from '@/entities/pipeline';
import { VariableBuilder } from '../VariableBuilder';

interface EditStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStep: (stepId: number, stepData: Partial<CreateStepRequest>) => Promise<void>;
  step: PipelineStep | null;
  apiItems: ApiItem[];
  loading?: boolean;
  totalSteps?: number;
}

interface VariableRule {
  id: string;
  variableName: string;
  jsonPath: string;
}

export const EditStepModal: React.FC<EditStepModalProps> = ({
  isOpen,
  onClose,
  onUpdateStep,
  step,
  apiItems,
  loading,
  totalSteps
}) => {
  const [selectedApiItem, setSelectedApiItem] = useState<number | null>(null);
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [extractionRules, setExtractionRules] = useState<VariableRule[]>([]);
  const [injectionRules, setInjectionRules] = useState<VariableRule[]>([]);
  const [delayAfter, setDelayAfter] = useState<number | undefined>(undefined);

  // step 데이터로 폼 초기화
  useEffect(() => {
    if (step && isOpen) {
      setSelectedApiItem(step.apiItem.id);
      setStepName(step.stepName);
      setStepDescription(step.description || '');
      setDelayAfter(step.delayAfter || undefined);

      // 데이터 추출 규칙 파싱
      if (step.dataExtractions && step.dataExtractions !== '{}') {
        try {
          const extractions = JSON.parse(step.dataExtractions);
          const rules: VariableRule[] = Object.entries(extractions).map(([key, value], index) => ({
            id: `extract_${index}`,
            variableName: key,
            jsonPath: value as string
          }));
          setExtractionRules(rules);
          setShowAdvancedSettings(true);
        } catch (e) {
          setExtractionRules([]);
        }
      } else {
        setExtractionRules([]);
      }

      // 데이터 주입 규칙 파싱
      if (step.dataInjections && step.dataInjections !== '{}') {
        try {
          const injections = JSON.parse(step.dataInjections);
          const rules: VariableRule[] = Object.entries(injections).map(([key, value], index) => ({
            id: `inject_${index}`,
            variableName: key,
            jsonPath: value as string
          }));
          setInjectionRules(rules);
          setShowAdvancedSettings(true);
        } catch (e) {
          setInjectionRules([]);
        }
      } else {
        setInjectionRules([]);
      }
    }
  }, [step, isOpen]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedApiItem(null);
      setStepName('');
      setStepDescription('');
      setApiSearchTerm('');
      setShowAdvancedSettings(false);
      setExtractionRules([]);
      setInjectionRules([]);
      setDelayAfter(undefined);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleUpdateStep = async () => {
    if (!selectedApiItem || !stepName.trim() || !step) return;

    try {
      const stepData: Partial<CreateStepRequest> = {
        apiItemId: selectedApiItem,
        stepName: stepName.trim(),
        description: stepDescription.trim()
      };
      
      // 고급 설정이 있는 경우에만 추가
      if (showAdvancedSettings) {
        if (extractionRules.length > 0) {
          const extractionObj = extractionRules.reduce((acc, rule) => ({
            ...acc,
            [rule.variableName]: rule.jsonPath
          }), {});
          stepData.dataExtractions = JSON.stringify(extractionObj);
        }
        
        if (injectionRules.length > 0) {
          const injectionObj = injectionRules.reduce((acc, rule) => ({
            ...acc,
            [rule.variableName]: rule.jsonPath
          }), {});
          stepData.dataInjections = JSON.stringify(injectionObj);
        }
        
        if (delayAfter) {
          stepData.delayAfter = delayAfter;
        }
      }
      
      await onUpdateStep(step.id, stepData);
    } catch (error) {
      console.error('EditStepModal.handleUpdateStep: Error in onUpdateStep:', error);
    }
  };

  const filteredApiItems = apiItems.filter(item => 
    item.name.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
    item.method.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(apiSearchTerm.toLowerCase()))
  );

  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">단계 편집 - Step {step.stepOrder}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              단계 이름 *
            </label>
            <input
              type="text"
              value={stepName}
              onChange={(e) => setStepName(e.target.value)}
              placeholder="예: 사용자 로그인, 프로필 조회 등"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택)
            </label>
            <textarea
              value={stepDescription}
              onChange={(e) => setStepDescription(e.target.value)}
              placeholder="단계에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 아이템 선택 *
            </label>
            
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="API 아이템 검색..."
                value={apiSearchTerm}
                onChange={(e) => setApiSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <svg 
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {apiSearchTerm && (
                <button
                  onClick={() => setApiSearchTerm('')}
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {filteredApiItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedApiItem(item.id)}
                  className={`p-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                    selectedApiItem === item.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedApiItem === item.id}
                      onChange={() => setSelectedApiItem(item.id)}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.method} {item.url}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 고급 설정 섹션 */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <svg 
                className={`w-4 h-4 transform transition-transform ${showAdvancedSettings ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              고급 설정 (데이터 전달)
            </button>
            
            {showAdvancedSettings && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-6">
                <div className="text-sm text-gray-600 mb-4">
                  💡 이전 단계의 응답 데이터를 추출하거나, 추출된 변수를 현재 단계에서 사용할 수 있습니다.
                </div>
                
                <VariableBuilder
                  title="📤 데이터 추출 설정"
                  type="extract"
                  rules={extractionRules}
                  onRulesChange={setExtractionRules}
                  placeholder='{"변수명": "JSON.경로"}'
                  sampleResponse={{
                    data: {
                      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      user: {
                        id: 123,
                        email: "user@example.com",
                        name: "홍길동"
                      }
                    },
                    status: "success",
                    message: "로그인 성공"
                  }}
                />
                
                <VariableBuilder
                  title="📥 데이터 주입 설정"
                  type="inject"
                  rules={injectionRules}
                  onRulesChange={setInjectionRules}
                  availableVariables={extractionRules.map(rule => rule.variableName)}
                  placeholder='{"헤더/바디.필드": "{{변수명}}"}'
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏱️ 단계 완료 후 대기시간 (밀리초)
                  </label>
                  <input
                    type="number"
                    value={delayAfter || ''}
                    onChange={(e) => setDelayAfter(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    다음 단계 실행 전 잠시 대기할 시간을 설정합니다 (기본값: 0ms)
                  </div>
                </div>
                
                {totalSteps && step.stepOrder > 1 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="text-sm text-yellow-800">
                      📌 이전 {step.stepOrder - 1}단계에서 추출된 변수들을 {`{{변수명}}`} 형식으로 사용할 수 있습니다.
                    </div>
                  </div>
                )}
              </div>
            )}
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
            onClick={handleUpdateStep}
            disabled={!selectedApiItem || !stepName.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};