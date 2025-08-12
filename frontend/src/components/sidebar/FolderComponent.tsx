import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import SortableItem from './SortableItem';
import { ApiFolder } from '../../types/api';

interface FolderComponentProps {
  folder: ApiFolder;
  selectedFolderId: string | null;
  selectedItemId: string | null;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onSelectItem: (item: any, folderId: string) => void;
  onDeleteItem: (folderId: string, itemId: string) => void;
  onAddItem: (folderId: string) => void;
  getMethodColor: (method: string) => string;
  onContextMenu: (e: React.MouseEvent, folderId: string, folderName: string) => void;
  onItemContextMenu: (e: React.MouseEvent, itemId: string, itemName: string, folderId: string) => void;
  isDragOverFolder: boolean;
}

const FolderComponent: React.FC<FolderComponentProps> = ({
  folder,
  selectedFolderId,
  selectedItemId,
  onToggleFolder,
  onSelectFolder,
  onDeleteFolder,
  onSelectItem,
  onDeleteItem,
  onAddItem,
  getMethodColor,
  onContextMenu,
  onItemContextMenu,
  isDragOverFolder
}) => {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-folder-${folder.id}`,
  });

  return (
    <div>
      <div 
        ref={setDroppableRef}
        className={`min-h-[40px] ${isDragOverFolder ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
      >
        <div 
          className={`px-3 py-2.5 cursor-pointer select-none hover:bg-gray-50 group flex items-center justify-between rounded-lg mx-2 transition-colors ${
            selectedFolderId === folder.id && !selectedItemId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
          }`}
          onClick={() => {
            onToggleFolder(folder.id);
            onSelectFolder(folder.id);
          }}
          onContextMenu={(e) => onContextMenu(e, folder.id, folder.name)}
        >
          <div className="flex items-center gap-2 font-medium">
            <span 
              className={`text-xs transition-transform duration-200 text-gray-500 ${
                folder.isExpanded ? 'rotate-90' : ''
              }`}
            >
              ▶
            </span>
            <span className="text-sm">{folder.name}</span>
          </div>
        </div>
        
        <div className={`${folder.isExpanded ? 'pt-1 pb-3' : ''}`}>
          {folder.isExpanded && folder.items.map(item => (
            <SortableItem
              key={item.id}
              item={item}
              folderId={folder.id}
              isSelected={selectedItemId === item.id}
              onSelectItem={onSelectItem}
              onDeleteItem={onDeleteItem}
              getMethodColor={getMethodColor}
              onItemContextMenu={onItemContextMenu}
            />
          ))}
          {folder.isExpanded && folder.items.length === 0 && (
            <div className="ml-8 mx-3 mt-1 py-3 text-xs text-gray-500 bg-gray-50 rounded-lg text-center border border-dashed border-gray-300">
              Drop items here or right-click to add
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderComponent;