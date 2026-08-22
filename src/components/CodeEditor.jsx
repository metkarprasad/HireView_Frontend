import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Send } from 'lucide-react';

const CodeEditor = ({ language, starterCode, onSubmit }) => {
  const [code, setCode] = useState(starterCode || '');

  useEffect(() => {
    setCode(starterCode || '');
  }, [starterCode]);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(code);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-lg relative">
      <div className="bg-slate-800 px-4 py-3 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-2 text-slate-300">
          <Code className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold tracking-wide text-sm">Coding Assessment</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 uppercase tracking-wider ml-2">
            {language || 'javascript'}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg transition-all"
        >
          Submit Code
          <Send className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language={language?.toLowerCase() || 'javascript'}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
