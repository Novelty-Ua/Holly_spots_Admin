
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  getTableColumns, 
  createRecord, 
  updateRecord, 
  fetchRecordById, 
  TableName,
  fetchRelatedRecords,
  fetchRecordRelations,
  updateRecordRelations
} from '@/services/supabaseService';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  table: TableName;
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
  const [relatedEntities, setRelatedEntities] = useState<any>({});
  const [selectedRelations, setSelectedRelations] = useState<any>({});
  
  const { toast } = useToast();
  
  // Получаем колонки для текущей таблицы
  const columns = getTableColumns(table, selectedLanguage);
  
  // Загружаем данные записи и связанные сущности при открытии сайдбара
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, record, table, selectedLanguage]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Получаем связанные сущности для выбора в форме
      if (['spots', 'routes', 'events'].includes(table)) {
        const relatedData = await fetchRelatedRecords(table as TableName);
        setRelatedEntities(relatedData);
      }
      
      if (record && record.id) {
        // Загружаем данные записи
        const data = await fetchRecordById(table, record.id);
        setFormData(data || {});
        
        // Если это таблица со связями - загружаем связи
        if (['spots', 'routes', 'events'].includes(table)) {
          const relations = await fetchRecordRelations(table as TableName, record.id);
          setSelectedRelations(relations);
        }
      } else {
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
        setSelectedRelations({});
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
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
  
  const handleRelationChange = (entityType: string, entityIds: string[]) => {
    setSelectedRelations(prev => ({
      ...prev,
      [entityType]: entityIds
    }));
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
      
      let savedRecord;
      
      if (record) {
        // Обновление существующей записи
        savedRecord = await updateRecord(table, record.id, dataToSave);
        
        // Обновляем связи если нужно
        if (['spots', 'routes', 'events'].includes(table) && Object.keys(selectedRelations).length > 0) {
          await updateRecordRelations(table as TableName, record.id, selectedRelations);
        }
        
        toast({
          title: "Успешно",
          description: "Запись успешно обновлена",
        });
      } else {
        // Создание новой записи
        savedRecord = await createRecord(table, dataToSave);
        
        // Обновляем связи для новой записи если нужно
        if (['spots', 'routes', 'events'].includes(table) && Object.keys(selectedRelations).length > 0 && savedRecord) {
          await updateRecordRelations(table as TableName, savedRecord.id, selectedRelations);
        }
        
        toast({
          title: "Успешно",
          description: "Запись успешно создана",
        });
      }
      
      // Закрываем сайдбар и сбрасываем форму
      onClose();
      setFormData({});
      setSelectedRelations({});
      
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
  
  // Генерация полей для выбора связанных сущностей
  const renderRelationshipFields = () => {
    if (isLoading) return null;
    
    switch (table) {
      case 'spots':
        return (
          <>
            {relatedEntities.routes && relatedEntities.routes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Связанные маршруты</label>
                <div className="border border-border rounded p-2 max-h-40 overflow-y-auto">
                  {relatedEntities.routes.map((route: any) => (
                    <div key={route.id} className="flex items-center mb-1">
                      <Checkbox 
                        id={`route-${route.id}`}
                        checked={selectedRelations.routes?.includes(route.id)}
                        onCheckedChange={(checked) => {
                          const routes = [...(selectedRelations.routes || [])];
                          if (checked) {
                            routes.push(route.id);
                          } else {
                            const index = routes.indexOf(route.id);
                            if (index !== -1) routes.splice(index, 1);
                          }
                          handleRelationChange('routes', routes);
                        }}
                      />
                      <label htmlFor={`route-${route.id}`} className="ml-2 text-sm">
                        {route.name && typeof route.name === 'object' ? route.name[selectedLanguage] || Object.values(route.name)[0] : route.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {relatedEntities.events && relatedEntities.events.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Связанные события</label>
                <div className="border border-border rounded p-2 max-h-40 overflow-y-auto">
                  {relatedEntities.events.map((event: any) => (
                    <div key={event.id} className="flex items-center mb-1">
                      <Checkbox 
                        id={`event-${event.id}`}
                        checked={selectedRelations.events?.includes(event.id)}
                        onCheckedChange={(checked) => {
                          const events = [...(selectedRelations.events || [])];
                          if (checked) {
                            events.push(event.id);
                          } else {
                            const index = events.indexOf(event.id);
                            if (index !== -1) events.splice(index, 1);
                          }
                          handleRelationChange('events', events);
                        }}
                      />
                      <label htmlFor={`event-${event.id}`} className="ml-2 text-sm">
                        {event.name && typeof event.name === 'object' ? event.name[selectedLanguage] || Object.values(event.name)[0] : event.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            break;
            
          case 'routes':
            return (
              <>
                {relatedEntities.spots && relatedEntities.spots.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Связанные объекты</label>
                    <div className="border border-border rounded p-2 max-h-40 overflow-y-auto">
                      {relatedEntities.spots.map((spot: any) => (
                        <div key={spot.id} className="flex items-center mb-1">
                          <Checkbox 
                            id={`spot-${spot.id}`}
                            checked={selectedRelations.spots?.includes(spot.id)}
                            onCheckedChange={(checked) => {
                              const spots = [...(selectedRelations.spots || [])];
                              if (checked) {
                                spots.push(spot.id);
                              } else {
                                const index = spots.indexOf(spot.id);
                                if (index !== -1) spots.splice(index, 1);
                              }
                              handleRelationChange('spots', spots);
                            }}
                          />
                          <label htmlFor={`spot-${spot.id}`} className="ml-2 text-sm">
                            {spot.name && typeof spot.name === 'object' ? spot.name[selectedLanguage] || Object.values(spot.name)[0] : spot.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {relatedEntities.events && relatedEntities.events.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Связанные события</label>
                    <div className="border border-border rounded p-2 max-h-40 overflow-y-auto">
                      {relatedEntities.events.map((event: any) => (
                        <div key={event.id} className="flex items-center mb-1">
                          <Checkbox 
                            id={`event-${event.id}`}
                            checked={selectedRelations.events?.includes(event.id)}
                            onCheckedChange={(checked) => {
                              const events = [...(selectedRelations.events || [])];
                              if (checked) {
                                events.push(event.id);
                              } else {
                                const index = events.indexOf(event.id);
                                if (index !== -1) events.splice(index, 1);
                              }
                              handleRelationChange('events', events);
                            }}
                          />
                          <label htmlFor={`event-${event.id}`} className="ml-2 text-sm">
                            {event.name && typeof event.name === 'object' ? event.name[selectedLanguage] || Object.values(event.name)[0] : event.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                break;
                
              case 'events':
                return (
                  <>
                    {relatedEntities.spots && relatedEntities.spots.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Связанные объекты</label>
                        <div className="border border-border rounded p-2 max-h-40 overflow-y-auto">
                          {relatedEntities.spots.map((spot: any) => (
                            <div key={spot.id} className="flex items-center mb-1">
                              <Checkbox 
                                id={`spot-${spot.id}`}
                                checked={selectedRelations.spots?.includes(spot.id)}
                                onCheckedChange={(checked) => {
                                  const spots = [...(selectedRelations.spots || [])];
                                  if (checked) {
                                    spots.push(spot.id);
                                  } else {
                                    const index = spots.indexOf(spot.id);
                                    if (index !== -1) spots.splice(index, 1);
                                  }
                                  handleRelationChange('spots', spots);
                                }}
                              />
                              <label htmlFor={`spot-${spot.id}`} className="ml-2 text-sm">
                                {spot.name && typeof spot.name === 'object' ? spot.name[selectedLanguage] || Object.values(spot.name)[0] : spot.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {relatedEntities.routes && relatedEntities.routes.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Связанные маршруты</label>
                        <div className="border border-border rounded p-2 max-h-40 overflow-y-auto">
                          {relatedEntities.routes.map((route: any) => (
                            <div key={route.id} className="flex items-center mb-1">
                              <Checkbox 
                                id={`route-${route.id}`}
                                checked={selectedRelations.routes?.includes(route.id)}
                                onCheckedChange={(checked) => {
                                  const routes = [...(selectedRelations.routes || [])];
                                  if (checked) {
                                    routes.push(route.id);
                                  } else {
                                    const index = routes.indexOf(route.id);
                                    if (index !== -1) routes.splice(index, 1);
                                  }
                                  handleRelationChange('routes', routes);
                                }}
                              />
                              <label htmlFor={`route-${route.id}`} className="ml-2 text-sm">
                                {route.name && typeof route.name === 'object' ? route.name[selectedLanguage] || Object.values(route.name)[0] : route.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    break;
            
                default:
                  return null;
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
        
        <ScrollArea className="flex-1 px-4 py-2">
          {renderFormFields()}
          {renderRelationshipFields()}
        </ScrollArea>
        
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
