import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Scenario {
  id: number;
  name: string;
  description: string;
  folderId: number | null;
  stepCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiItem {
  id: number;
  name: string;
  method: string;
  url: string;
  description?: string;
}

interface ScenarioStep {
  id: number;
  stepOrder: number;
  stepName: string;
  description?: string;
  apiItem: ApiItem;
}

interface PipelineManagementPageProps {
  selectedPipeline?: Scenario | null;
}

const PipelineManagementPage: React.FC<PipelineManagementPageProps> = ({ 
  selectedPipeline
}) => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<ScenarioStep[]>([]);
  const [apiItems, setApiItems] = useState<ApiItem[]>([]);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [selectedApiItem, setSelectedApiItem] = useState<number | null>(null);
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [apiSearchTerm, setApiSearchTerm] = useState('');

  // Load steps when pipeline is selected
  useEffect(() => {
    if (selectedPipeline) {
      fetchSteps(selectedPipeline.id);
    }
  }, [selectedPipeline]);

  // Load API items for step creation
  useEffect(() => {
    fetchApiItems();
  }, []);

  const fetchSteps = async (scenarioId: number) => {
    console.log('Fetching steps for scenario:', scenarioId);
    try {
      const response = await fetch(`http://localhost:8080/api/scenarios/${scenarioId}/steps`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched steps:', data);
        setSteps(data);
      } else {
        console.error('Failed to fetch steps. Status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  };

  const fetchApiItems = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/items', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setApiItems(data);
      }
    } catch (error) {
      console.error('Error fetching API items:', error);
    }
  };

  const addStep = async () => {
    if (!selectedPipeline || !selectedApiItem || !stepName.trim()) return;

    console.log('Adding step with data:', {
      pipelineId: selectedPipeline.id,
      apiItemId: selectedApiItem,
      stepName: stepName.trim(),
      description: stepDescription.trim()
    });

    try {
      const response = await fetch(`http://localhost:8080/api/pipelines/${selectedPipeline.id}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          apiItemId: selectedApiItem,
          stepName: stepName.trim(),
          description: stepDescription.trim()
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Step added successfully:', result);
        fetchSteps(selectedPipeline.id);
        setShowAddStepModal(false);
        setSelectedApiItem(null);
        setStepName('');
        setStepDescription('');
        setApiSearchTerm('');
      } else {
        const errorText = await response.text();
        console.error('Failed to add step. Status:', response.status, 'Error:', errorText);
      }
    } catch (error) {
      console.error('Error adding step:', error);
    }
  };

  const deleteStep = async (stepId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/scenarios/steps/${stepId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok && selectedPipeline) {
        fetchSteps(selectedPipeline.id);
      }
    } catch (error) {
      console.error('Error deleting step:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">테스트 시나리오</h1>
            <p className="text-sm text-gray-600 mt-1">
              의존성이 있는 API 테스트 시나리오를 생성하고 관리합니다
            </p>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {selectedPipeline ? (
          /* Selected Pipeline Detail View */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Scenario Header */}
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
                    <h1 className="text-2xl font-bold text-gray-900">{selectedPipeline.name}</h1>
                  </div>
                  <p className="text-gray-600 mb-4">{selectedPipeline.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{selectedPipeline.stepCount}개 단계</span>
                    <span>•</span>
                    <span>생성일: {new Date(selectedPipeline.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>수정일: {new Date(selectedPipeline.updatedAt).toLocaleDateString()}</span>
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

            {/* Scenario Steps */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">시나리오 단계</h3>
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {step.stepOrder}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {step.stepName}
                        </div>
                        <div className="text-sm text-gray-500 mb-1">
                          {step.apiItem.method} {step.apiItem.url}
                        </div>
                        {step.description && (
                          <div className="text-sm text-gray-600">
                            {step.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {step.stepOrder > 1 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            데이터 의존성
                          </span>
                        )}
                        <button 
                          onClick={() => deleteStep(step.id)}
                          className="text-red-400 hover:text-red-600"
                          title="단계 삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {step.stepOrder > 1 && (
                      <div className="ml-11 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                        이전 단계에서 추출된 데이터를 사용할 수 있습니다
                      </div>
                    )}
                  </div>
                ))}

                {steps.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    아직 추가된 단계가 없습니다. 첫 번째 단계를 추가해보세요.
                  </div>
                )}
              </div>

              {/* Add Step Button */}
              <button 
                onClick={() => setShowAddStepModal(true)}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + 새 단계 추가
              </button>
            </div>
          </div>
        ) : (
          /* Default View when no scenario is selected */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                시나리오 관리
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                좌측 사이드바에서 시나리오를 선택하거나 새로운 시나리오를 생성하세요.
              </p>
            
              {/* Feature Preview */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">곧 출시될 기능:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    순차적 API 실행
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    데이터 추출 및 주입
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    조건부 단계 실행
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    변수 관리
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    시나리오 템플릿
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    상세 실행 리포트
                  </div>
                </div>
              </div>
              
              {/* Example Scenario */}
              <div className="bg-blue-50 rounded-lg p-6 text-left">
                <h4 className="text-md font-medium text-blue-900 mb-3">시나리오 예시:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>POST /auth/login → 추출: authToken</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>GET /user/profile → 주입: Authorization 헤더</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>PUT /user/profile → 추출된 사용자 데이터 사용</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Step Modal */}
      {showAddStepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">새 단계 추가</h2>
              <button 
                onClick={() => {
                  setShowAddStepModal(false);
                  setSelectedApiItem(null);
                  setStepName('');
                  setStepDescription('');
                  setApiSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Step Name */}
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

              {/* Step Description */}
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

              {/* API Item Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 아이템 선택 *
                </label>
                
                {/* API Search Bar */}
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
                  {apiItems
                    .filter(item => 
                      item.name.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
                      item.method.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
                      item.url.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
                      (item.description && item.description.toLowerCase().includes(apiSearchTerm.toLowerCase()))
                    )
                    .map((item) => (
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
                  
                  {apiItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      사용 가능한 API 아이템이 없습니다.
                    </div>
                  ) : apiItems.filter(item => 
                      item.name.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
                      item.method.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
                      item.url.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
                      (item.description && item.description.toLowerCase().includes(apiSearchTerm.toLowerCase()))
                    ).length === 0 && apiSearchTerm && (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-2xl mb-2">🔍</div>
                      <div className="text-sm">
                        "{apiSearchTerm}"에 대한 검색 결과가 없습니다.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddStepModal(false);
                  setSelectedApiItem(null);
                  setStepName('');
                  setStepDescription('');
                  setApiSearchTerm('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={addStep}
                disabled={!selectedApiItem || !stepName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                단계 추가
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PipelineManagementPage;