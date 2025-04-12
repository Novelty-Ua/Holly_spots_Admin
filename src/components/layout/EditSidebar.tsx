
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getTableColumns, createRecord, updateRecord, fetchRecordById } from '@/services/supabaseService';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ru');
  
  const { toast } = useToast();
  
  // Получаем колонки для текущей таблицы
  const columns = getTableColumns(table, selectedLanguage);
  
  // Загружаем данные записи при открытии сайдбара
  useEffect(() => {
    if (isOpen && record && record.id) {
      loadRecord();
    } else if (isOpen && !record) {
      // Новая запись, инициализируем пустыми значениями
      const emptyData: any = {};
      columns.forEach(column => {
        if (column.isJsonb) {
          emptyData[column.key] = { ru: '', en: '', hi: '' };
        } else if (column.isArray) {
          emptyData[column.key] = [];
        } else {
          emptyData[column.key] = '';
        }
      });
      setFormData(emptyData);
    }
  }, [isOpen, record, table, selectedLanguage]);
  
  const loadRecord = async () => {
    try {
      setIsLoading(true);
      const data = await fetchRecordById(table, record.id);
      setFormData(data || {});
    } catch (error) {
      console.error('Error loading record:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные записи",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (key: string, value: any, isJsonbField: boolean = false) => {
    if (isJsonbField) {
      setFormData(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          [selectedLanguage]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Обработка данных перед отправкой
      const dataToSave = { ...formData };
      
      // Удаляем id при создании новой записи
      if (!record) {
        delete dataToSave.id;
      }
      
      if (record) {
        // Обновление существующей записи
        await updateRecord(table, record.id, dataToSave);
        toast({
          title: "Успешно",
          description: "Запись успешно обновлена",
        });
      } else {
        // Создание новой записи
        await createRecord(table, dataToSave);
        toast({
          title: "Успешно",
          description: "Запись успешно создана",
        });
      }
      
      // Закрываем сайдбар и сбрасываем форму
      onClose();
      setFormData({});
      
      // Перезагрузка данных в основной таблице
      // Это нужно реализовать через контекст или колбэк
      
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить запись",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Генерация полей формы на основе структуры таблицы
  const renderFormFields = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="mb-4">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ));
    }
    
    return columns.map(column => {
      // Пропускаем id и системные поля при создании новой записи
      if ((!record && column.key === 'id') || 
          column.key === 'created_at' || 
          column.key === 'updated_at') {
        return null;
      }
      
      // Для мультиязычных полей показываем только текущий язык
      if (column.isJsonb && column.language) {
        const jsonValue = formData[column.key] || {};
        const languageValue = jsonValue[selectedLanguage] || '';
        
        return (
          <div key={column.key} className="mb-4">
            <label className="block text-sm font-medium mb-1">{column.label}</label>
            {column.key === 'info' ? (
              <Textarea
                value={languageValue}
                onChange={(e) => handleInputChange(column.key, e.target.value, true)}
                className="w-full"
                rows={4}
              />
            ) : (
              <Input
                type="text"
                value={languageValue}
                onChange={(e) => handleInputChange(column.key, e.target.value, true)}
                className="w-full"
              />
            )}
          </div>
        );
      }
      
      // Простые текстовые поля
      if (!column.isArray && !column.isGeometry && !column.isJsonb) {
        return (
          <div key={column.key} className="mb-4">
            <label className="block text-sm font-medium mb-1">{column.label}</label>
            <Input
              type={column.key === 'email' ? 'email' : 'text'}
              value={formData[column.key] || ''}
              onChange={(e) => handleInputChange(column.key, e.target.value)}
              disabled={column.key === 'id'} // ID нельзя редактировать
              className="w-full"
            />
          </div>
        );
      }
      
      // Для полей с типом массив или JSON (кроме мультиязычных) показываем как текст JSON
      if ((column.isArray || (column.isJsonb && !column.language)) && column.key !== 'point') {
        const value = formData[column.key] || '';
        return (
          <div key={column.key} className="mb-4">
            <label className="block text-sm font-medium mb-1">{column.label}</label>
            <Textarea
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => {
                try {
                  const newValue = JSON.parse(e.target.value);
                  handleInputChange(column.key, newValue);
                } catch {
                  // Если не валидный JSON, сохраняем как строку
                  handleInputChange(column.key, e.target.value);
                }
              }}
              className="w-full font-mono text-xs"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">Формат JSON</p>
          </div>
        );
      }
      
      // Поля с геометрией (точки на карте)
      if (column.isGeometry) {
        return (
          <div key={column.key} className="mb-4">
            <label className="block text-sm font-medium mb-1">{column.label}</label>
            <div className="p-4 bg-muted/20 rounded border border-border">
              <p className="text-sm text-muted-foreground">
                Редактирование координат будет доступно в следующей версии
              </p>
              <p className="text-xs mt-2 font-mono">
                {formData[column.key] ? String(formData[column.key]).substring(0, 30) + '...' : 'Нет данных'}
              </p>
            </div>
          </div>
        );
      }
      
      return null;
    });
  };
  
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
        
        {table && (
          <div className="flex border-b border-border py-2 px-4 gap-2">
            <Button 
              variant={selectedLanguage === 'ru' ? 'default' : 'outline'} 
              onClick={() => setSelectedLanguage('ru')}
              size="sm"
            >
              РУС
            </Button>
            <Button 
              variant={selectedLanguage === 'en' ? 'default' : 'outline'} 
              onClick={() => setSelectedLanguage('en')}
              size="sm"
            >
              ENG
            </Button>
            <Button 
              variant={selectedLanguage === 'hi' ? 'default' : 'outline'} 
              onClick={() => setSelectedLanguage('hi')}
              size="sm"
            >
              HIN
            </Button>
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-4">
          {renderFormFields()}
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Сохранение...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
