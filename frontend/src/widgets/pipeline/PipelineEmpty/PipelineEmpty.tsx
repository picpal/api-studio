import React from 'react';

export const PipelineEmpty: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          API Pipeline
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          좌측 사이드바에서 시나리오를 선택하거나 <br /> 새로운 시나리오를 생성하세요.
        </p>
      
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
  );
};