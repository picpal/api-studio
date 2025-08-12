import React from 'react';

interface ContextMenuProps {
  show: boolean;
  x: number;
  y: number;
  onRename: () => void;
  onAddItem: () => void;
  onDelete: () => void;
}

interface ItemContextMenuProps {
  show: boolean;
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
}

export const FolderContextMenu: React.FC<ContextMenuProps> = ({
  show,
  x,
  y,
  onRename,
  onAddItem,
  onDelete
}) => {
  if (!show) return null;

  return (
    <div 
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
      style={{ 
        left: x, 
        top: y,
        minWidth: '120px'
      }}
    >
      <button
        onClick={onRename}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        ✏️ Rename
      </button>
      <button
        onClick={onAddItem}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        ➕ Add Item
      </button>
      <hr className="my-1 border-gray-200" />
      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        🗑️ Delete
      </button>
    </div>
  );
};

export const ItemContextMenu: React.FC<ItemContextMenuProps> = ({
  show,
  x,
  y,
  onRename,
  onDelete
}) => {
  if (!show) return null;

  return (
    <div 
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
      style={{ 
        left: x, 
        top: y,
        minWidth: '120px'
      }}
    >
      <button
        onClick={onRename}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        ✏️ Rename
      </button>
      <hr className="my-1 border-gray-200" />
      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        🗑️ Delete
      </button>
    </div>
  );
};