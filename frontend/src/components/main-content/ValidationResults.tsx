import React from 'react';

interface ValidationResultsProps {
  validationEnabled: boolean;
  lastValidationResult: any;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ validationEnabled, lastValidationResult }) => {
  if (!validationEnabled) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">⚙️</div>
          <div className="text-sm">Response validation is disabled</div>
          <div className="text-xs text-gray-400 mt-1">Enable it in the "Response Validation" tab to see validation results</div>
        </div>
      </div>
    );
  }

  if (!lastValidationResult) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm">No validation results yet</div>
          <div className="text-xs text-gray-400 mt-1">Send a request to see validation results</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-h-[450px] overflow-auto w-full">
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border ${
          lastValidationResult.passed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg ${lastValidationResult.passed ? 'text-green-600' : 'text-red-600'}`}>
              {lastValidationResult.passed ? '✅' : '❌'}
            </span>
            <h3 className={`text-md font-semibold ${lastValidationResult.passed ? 'text-green-800' : 'text-red-800'}`}>
              Validation {lastValidationResult.passed ? 'Passed' : 'Failed'}
            </h3>
          </div>
          <p className="text-sm text-gray-700">
            {lastValidationResult.results.filter((r: any) => r.passed).length} / {lastValidationResult.results.length} tests passed
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Test Results:</h4>
          {lastValidationResult.results.map((result: any, index: number) => (
            <div key={index} className={`p-3 rounded border text-sm ${
              result.passed 
                ? 'bg-green-100 border-green-300' 
                : 'bg-red-100 border-red-300'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                    {result.passed ? '✅' : '❌'}
                  </span>
                  <span className="font-medium font-mono">{result.key}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  result.passed 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Expected:</span> 
                  <span className="font-mono ml-1">{
                    typeof result.expectedValue === 'string' 
                      ? `"${result.expectedValue}"` 
                      : JSON.stringify(result.expectedValue)
                  }</span>
                </div>
                <div>
                  <span className="font-medium">Actual:</span> 
                  <span className="font-mono ml-1">{
                    typeof result.actualValue === 'undefined' 
                      ? 'undefined'
                      : typeof result.actualValue === 'string' 
                      ? `"${result.actualValue}"`
                      : JSON.stringify(result.actualValue)
                  }</span>
                </div>
                {result.error && (
                  <div className="text-red-600 mt-1">
                    <span className="font-medium">Error:</span> {result.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValidationResults;
