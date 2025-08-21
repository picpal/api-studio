import React from 'react';

interface HeadersEditorProps {
    headersList: Array<{key: string, value: string, id: string}>;
    setHeadersList: React.Dispatch<React.SetStateAction<Array<{key: string, value: string, id: string}>>>;
    updateHeader: (id: string, field: 'key' | 'value', value: string) => void;
}

const HeadersEditor: React.FC<HeadersEditorProps> = ({ headersList, setHeadersList, updateHeader }) => {
    return (
        <div className="overflow-y-auto" style={{maxHeight: 'calc(100vh - 480px)', minHeight: '250px'}}>
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-300 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '45%'}}>
                    Key
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '45%'}}>
                    Value
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 w-10">
                    Del
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {headersList.map((header) => (
                  <tr key={header.id} className="hover:bg-gray-50 border-b border-gray-300">
                    <td className="px-3 py-2 border-r border-gray-300">
                      <input
                        className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-gray-300">
                      <input
                        className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => setHeadersList(headersList.filter(h => h.id !== header.id))}
                        className="text-gray-400 hover:text-red-600 text-sm transition-colors duration-200"
                        title="Delete Header"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-white">
              <button
                onClick={() => setHeadersList([...headersList, { key: '', value: '', id: Date.now().toString() }])}
                className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
                title="Add Header"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Header
              </button>
            </div>
        </div>
    );
};

export default HeadersEditor;
