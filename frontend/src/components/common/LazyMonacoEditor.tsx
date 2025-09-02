import React, { Suspense, lazy } from 'react';

// Monaco Editor를 동적으로 임포트
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

interface LazyMonacoEditorProps {
  height?: string;
  language?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  theme?: string;
  options?: any;
  loading?: React.ReactNode;
}

const LazyMonacoEditor: React.FC<LazyMonacoEditorProps> = ({ 
  loading = <div className="p-4 text-gray-500 flex items-center justify-center">Loading editor...</div>,
  ...props 
}) => {
  return (
    <Suspense fallback={loading}>
      <MonacoEditor {...props} />
    </Suspense>
  );
};

export default LazyMonacoEditor;