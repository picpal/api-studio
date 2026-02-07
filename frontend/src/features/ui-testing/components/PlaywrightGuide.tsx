import React, { useState } from 'react';

const CODEGEN_COMMAND =
  'npx playwright codegen --target playwright-test -o ./test.spec.js http://localhost:3001';

const CAUTIONS = [
  'Playwright가 설치되어 있어야 합니다 (npm init playwright@latest)',
  '--target playwright-test 옵션은 필수입니다 (Playwright Test 형식)',
  '출력 파일명은 변경 가능하지만 .spec.js 확장자를 유지하세요',
  '마지막 URL은 테스트 대상 사이트 주소로 변경하세요',
];

export const PlaywrightGuide: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CODEGEN_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      data-testid="playwright-guide"
      className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3"
    >
      <p className="text-xs font-medium text-blue-700 mb-2">
        테스트 파일 생성 방법
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-white border border-blue-100 rounded px-3 py-2 text-xs font-mono text-gray-700">
          {CODEGEN_COMMAND}
        </code>
        <button
          data-testid="copy-codegen-command"
          onClick={handleCopy}
          className="shrink-0 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
        >
          복사
        </button>
      </div>
      {copied && (
        <span
          data-testid="copy-success-message"
          className="text-xs text-green-600 mt-1 inline-block"
        >
          복사되었습니다!
        </span>
      )}
      <ul data-testid="playwright-cautions" className="mt-2 space-y-0.5">
        {CAUTIONS.map((caution, index) => (
          <li key={index} className="text-xs text-amber-700 flex items-start gap-1">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{caution}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlaywrightGuide;
