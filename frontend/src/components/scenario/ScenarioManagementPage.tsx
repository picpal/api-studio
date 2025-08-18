import React, { useState, useEffect } from 'react';
import { TestScenario, TestStep, DataExtraction, DataInjection } from '../../types/scenario';
import { ApiItem } from '../../types/api';
import ScenarioEditor from './ScenarioEditor';
import ScenarioList from './ScenarioList';
import ScenarioRunner from './ScenarioRunner';

interface ScenarioManagementPageProps {
  apiItems: ApiItem[];
  folders: any[];
}

const ScenarioManagementPage: React.FC<ScenarioManagementPageProps> = ({ apiItems, folders }) => {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'run'>('list');
  const [isCreating, setIsCreating] = useState(false);

  // Mock scenarios for demo
  useEffect(() => {
    const mockScenarios: TestScenario[] = [
      {
        id: '1',
        name: 'User Authentication Flow',
        description: 'Complete user authentication and profile retrieval flow',
        steps: [
          {
            id: 'step1',
            apiId: '1', // Login API
            apiName: 'User Login',
            order: 1,
            dataExtractions: [
              {
                id: 'extract1',
                name: 'authToken',
                source: 'response_body',
                jsonPath: 'data.token',
                description: 'Authentication token from login response'
              }
            ]
          },
          {
            id: 'step2',
            apiId: '2', // Get Profile API
            apiName: 'Get User Profile',
            order: 2,
            dataInjections: [
              {
                id: 'inject1',
                variableName: 'authToken',
                target: 'headers',
                targetKey: 'Authorization',
                placeholder: 'Bearer {authToken}'
              }
            ],
            condition: {
              type: 'if_previous_success'
            }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ];
    
    setScenarios(mockScenarios);
  }, []);

  const handleCreateScenario = () => {
    setSelectedScenario(null);
    setIsCreating(true);
    setActiveTab('edit');
  };

  const handleEditScenario = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setIsCreating(false);
    setActiveTab('edit');
  };

  const handleSaveScenario = (scenario: TestScenario) => {
    if (isCreating) {
      const newScenario = {
        ...scenario,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setScenarios([...scenarios, newScenario]);
    } else {
      setScenarios(scenarios.map(s => 
        s.id === scenario.id ? { ...scenario, updatedAt: new Date() } : s
      ));
    }
    setActiveTab('list');
    setSelectedScenario(null);
    setIsCreating(false);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setScenarios(scenarios.filter(s => s.id !== scenarioId));
  };

  const handleRunScenario = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setActiveTab('run');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Scenarios</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage API test scenarios with dependencies
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              {[
                { id: 'list' as const, label: 'Scenarios' },
                { id: 'edit' as const, label: selectedScenario ? 'Edit' : 'Create' },
                { id: 'run' as const, label: 'Run' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={tab.id === 'edit' && !selectedScenario && !isCreating}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            
            {activeTab === 'list' && (
              <button
                onClick={handleCreateScenario}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                + New Scenario
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'list' && (
          <ScenarioList
            scenarios={scenarios}
            onEdit={handleEditScenario}
            onDelete={handleDeleteScenario}
            onRun={handleRunScenario}
          />
        )}
        
        {activeTab === 'edit' && (
          <ScenarioEditor
            scenario={selectedScenario}
            apiItems={apiItems}
            folders={folders}
            onSave={handleSaveScenario}
            onCancel={() => {
              setActiveTab('list');
              setSelectedScenario(null);
              setIsCreating(false);
            }}
          />
        )}
        
        {activeTab === 'run' && selectedScenario && (
          <ScenarioRunner
            scenario={selectedScenario}
            apiItems={apiItems}
            onBack={() => setActiveTab('list')}
          />
        )}
      </div>
    </div>
  );
};

export default ScenarioManagementPage;