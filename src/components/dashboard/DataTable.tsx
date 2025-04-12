
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Pagination } from './Pagination';
import { Skeleton } from '@/components/ui/skeleton';

interface Column {
  key: string;
  label: string;
  isJsonb?: boolean;
  isArray?: boolean;
  language?: string;
  isGeometry?: boolean;
  foreignKey?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onEdit: (record: any) => void;
  onDelete: (record: any) => void;
  onView: (record: any) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const formatCellValue = (row: any, column: Column) => {
    const { key, isJsonb, language, isArray, isGeometry } = column;
    const value = row[key];
    
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Обработка JSON полей с мультиязычностью
    if (isJsonb && typeof value === 'object' && language && value[language]) {
      return value[language];
    }
    
    // Обработка массивов (images, urls)
    if (isArray || Array.isArray(value)) {
      if (!value || value.length === 0) return '-';
      
      // Проверяем, являются ли элементы URL изображений
      if (typeof value[0] === 'string' && 
         (value[0].includes('.jpg') || value[0].includes('.png') || value[0].includes('.jpeg'))) {
        return <span className="text-blue-400">{value.length} изображений</span>;
      }
      
      return value.join(', ').substring(0, 50) + (value.join(', ').length > 50 ? '...' : '');
    }
    
    // Обработка геометрии (точки на карте)
    if (isGeometry && value) {
      return <span className="text-green-400">Геолокация</span>;
    }
    
    // Для объектов JSON, которые не являются мультиязычными
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value).substring(0, 100) + 
             (JSON.stringify(value).length > 100 ? '...' : '');
    }
    
    // Обрезаем длинные текстовые значения
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    // Форматирование даты
    if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    
    return value;
  };
  
  // Отображение состояния загрузки
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column.key}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 border-t border-border/40">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-lg border border-border/40 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center h-32">
                  Нет данных для отображения
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column.key}`}>
                      {formatCellValue(row, column)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(row)}
                      title="Просмотреть"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(row)}
                      title="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(row)}
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-4 border-t border-border/40">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
