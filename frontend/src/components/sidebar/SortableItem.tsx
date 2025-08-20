import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  item: any;
  folderId: string;
  isSelected: boolean;
  onSelectItem: (item: any, folderId: string) => void;
  onDeleteItem: (folderId: string, itemId: string) => void;
  getMethodColor: (method: string) => string;
  onItemContextMenu: (e: React.MouseEvent, itemId: string, itemName: string, folderId: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  folderId,
  isSelected,
  onSelectItem,
  onDeleteItem,
  getMethodColor,
  onItemContextMenu
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`ml-8 mx-3 mb-1 px-2.5 py-1.5 flex items-center cursor-pointer hover:bg-gray-50 group rounded-md transition-colors ${
        isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:border hover:border-gray-200'
      }`}
      onClick={() => onSelectItem(item, folderId)}
      onContextMenu={(e) => onItemContextMenu(e, item.id, item.name, folderId)}
    >
      <div className="flex items-center gap-2">
        <span 
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 text-xs"
        >
          ⋮⋮
        </span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${getMethodColor(item.method)}`}>
          {item.method}
        </span>
        <span className="text-xs truncate">{item.name}</span>
      </div>
    </div>
  );
};

export default SortableItem;