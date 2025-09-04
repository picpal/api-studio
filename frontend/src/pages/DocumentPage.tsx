import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

import apiGuideContent from '../docs/api-guide.md?raw';
import gettingStartedContent from '../docs/getting-started.md?raw';
import apiTestingGuideContent from '../docs/api-testing-guide.md?raw';
import pipelinesGuideContent from '../docs/pipelines-guide.md?raw';
import testReportGuideContent from '../docs/test-report-guide.md?raw';
import adminGuideContent from '../docs/admin-guide.md?raw';
import apiKeyGuideContent from '../docs/api-key-guide.md?raw';
import apiOverviewContent from '../docs/api-overview.md?raw';
import apiAuthenticationContent from '../docs/api-authentication.md?raw';
import apiPipelinesContent from '../docs/api-pipelines.md?raw';
import apiStepsContent from '../docs/api-steps.md?raw';

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  category: string;
}

interface DocumentCategory {
  id: string;
  title: string;
  icon: string;
  sections: DocumentSection[];
}

const DocumentPage: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<string>('getting-started');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['user-guides']));

  const documentCategories: DocumentCategory[] = [
    {
      id: 'user-guides',
      title: '사용자 가이드',
      icon: '📖',
      sections: [
        {
          id: 'getting-started',
          title: '시작하기',
          content: gettingStartedContent,
          icon: '🚀',
          category: 'user-guides'
        },
        {
          id: 'api-testing-guide',
          title: 'API Testing',
          content: apiTestingGuideContent,
          icon: '🧪',
          category: 'user-guides'
        },
        {
          id: 'pipelines-guide',
          title: 'Pipelines',
          content: pipelinesGuideContent,
          icon: '🔄',
          category: 'user-guides'
        },
        {
          id: 'test-report-guide',
          title: 'Test & Report',
          content: testReportGuideContent,
          icon: '📊',
          category: 'user-guides'
        },
        {
          id: 'admin-guide',
          title: 'Admin',
          content: adminGuideContent,
          icon: '🔧',
          category: 'user-guides'
        }
      ]
    },
    {
      id: 'api-reference',
      title: 'API 레퍼런스',
      icon: '🔌',
      sections: [
        {
          id: 'api-overview',
          title: 'API 개요',
          content: apiOverviewContent,
          icon: '🌐',
          category: 'api-reference'
        },
        {
          id: 'api-authentication',
          title: 'Authentication',
          content: apiAuthenticationContent,
          icon: '🔐',
          category: 'api-reference'
        },
        {
          id: 'api-pipelines',
          title: 'Pipelines',
          content: apiPipelinesContent,
          icon: '🔄',
          category: 'api-reference'
        },
        {
          id: 'api-steps',
          title: 'Steps',
          content: apiStepsContent,
          icon: '⚙️',
          category: 'api-reference'
        }
      ]
    },
    {
      id: 'general-guides',
      title: '일반 가이드',
      icon: '📚',
      sections: [
        {
          id: 'api-guide',
          title: '전체 API 가이드',
          content: apiGuideContent,
          icon: '📋',
          category: 'general-guides'
        },
        {
          id: 'api-key-guide',
          title: 'API Key 발급',
          content: apiKeyGuideContent,
          icon: '🔑',
          category: 'general-guides'
        }
      ]
    }
  ];

  const allSections = documentCategories.flatMap(cat => cat.sections);

  const currentSection = allSections.find(section => section.id === selectedSection);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Documentation</h2>
          <nav className="space-y-2">
            {documentCategories.map((category) => (
              <div key={category.id} className="space-y-1">
                {/* 카테고리 헤더 */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{category.icon}</span>
                    {category.title}
                  </div>
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${
                      expandedCategories.has(category.id) ? 'rotate-90' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* 카테고리 섹션들 */}
                {expandedCategories.has(category.id) && (
                  <div className="ml-4 space-y-1">
                    {category.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                          selectedSection === section.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm">{section.icon}</span>
                        {section.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {currentSection && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-full">
              <div className="p-8">
                <div className="prose prose-gray max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      
                      return !inline && language ? (
                        <SyntaxHighlighter
                          style={tomorrow}
                          language={language}
                          PreTag="div"
                          className="rounded-md"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code 
                          className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" 
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4 pb-2 border-b border-gray-100">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg font-medium text-gray-700 mt-5 mb-2">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="text-gray-600 mb-4 ml-6 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="text-gray-600 mb-4 ml-6 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="list-disc">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-200 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gray-50">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-gray-200">
                        {children}
                      </tbody>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {children}
                      </td>
                    ),
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-800">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-700">
                        {children}
                      </em>
                    )
                  }}
                >
                  {currentSection.content}
                </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;