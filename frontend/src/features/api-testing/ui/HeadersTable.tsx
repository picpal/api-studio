import React from 'react';
import Button from '../ui/Button';

interface HeaderItem {
  key: string;
  value: string;
  id: string;
}

interface HeadersTableProps {
  headersList: HeaderItem[];
  onUpdateHeader: (id: string, field: 'key' | 'value', value: string) => void;
  onRemoveHeader: (id: string) => void;
  onAddHeader: () => void;
}

const HeadersTable: React.FC<HeadersTableProps> = ({
  headersList,
  onUpdateHeader,
  onRemoveHeader,
  onAddHeader
}) => {
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
                  onChange={(e) => onUpdateHeader(header.id, 'key', e.target.value)}
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-300">
                <input
                  className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => onUpdateHeader(header.id, 'value', e.target.value)}
                />
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => onRemoveHeader(header.id)}
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
        <Button
          onClick={onAddHeader}
          variant="ghost"
          size="sm"
          className="w-full bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white border-blue-200 hover:border-blue-600"
          title="Add Header"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Header
        </Button>
      </div>
    </div>
  );
};

export { HeadersTable };