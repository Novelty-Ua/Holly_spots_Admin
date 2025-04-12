
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  table: string;
}

export const EditSidebar: React.FC<EditSidebarProps> = ({ 
  isOpen, 
  onClose, 
  record, 
  table 
}) => {
  return (
    <div 
      className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-card border-l border-border z-20 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium">
            {record ? 'Редактирование записи' : 'Создание записи'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {/* Dynamic form will be here based on table and record */}
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Форма для таблицы: <span className="font-medium text-foreground">{table}</span>
            </p>
            
            {record ? (
              <pre className="p-4 rounded bg-muted/20 text-xs overflow-auto">
                {JSON.stringify(record, null, 2)}
              </pre>
            ) : (
              <p>Заполните форму для создания новой записи</p>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button>Сохранить</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
