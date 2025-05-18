
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Pagination } from './Pagination';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Добавим утилиту для классов

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

interface DataTableProps {
  data: any[];
  columns: any[];
  onEdit: (record: any) => void;
  onDelete: (record: any) => void;
  onView: (record: any) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
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
  isLoading,
  sortConfig,
  onSort
}) => {

  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/70" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Функция для форматирования ячейки данных
  const formatCellData = (record: any, column: any) => {
    const value = record[column.key]; // The original value (e.g., FK ID)

    // Handle foreign key columns first
    if (column.foreignKey) {
      // Special handling for 'city' column in 'spots' table using the pre-fetched cityName
      if (column.key === 'city' && record.cityName) {
        return record.cityName;
      }

      // Original logic for other foreign keys (like 'country' in 'cities')
      const relatedTableKey = column.foreignKey; // e.g., 'countries'
      const relatedData = record[relatedTableKey]; // e.g., record.countries
      
      // Check if related data exists and if its 'name' property is a JSONB object
      if (relatedData && typeof relatedData === 'object' && relatedData.name && typeof relatedData.name === 'object') {
        // Extract the name for the current language from the JSONB object
        const lang = column.language || 'ru';
        const displayName = relatedData.name[lang];
        if (typeof displayName === 'string') {
          return displayName;
        }
      }
      // Fallback: display the original FK ID
      return value !== null && value !== undefined ? String(value) : '-';
    }
    
    // If not a foreign key, proceed with existing logic:
    // Если значение отсутствует
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Обработка JSON полей с языками (или текстовых полей, которые должны быть JSON)
    if (column.isJsonb && column.language) {
      let displayValue = '-';
      
      // Проверяем, является ли значение объектом (ожидаемый JSONB)
      if (typeof value === 'object' && value !== null) {
        displayValue = value[column.language] || '-'; // Берем значение для нужного языка
      }
      // Если это не объект, но строка (неправильный формат, но пытаемся отобразить)
      else if (typeof value === 'string') {
        displayValue = value; // Отображаем строку как есть
      }
      
      // Применяем обрезку, если необходимо
      if (column.truncate && typeof displayValue === 'string') {
        return displayValue.length > 50 ? `${displayValue.substring(0, 50)}...` : displayValue;
      }
      
      return displayValue;
    }
    
    // Обработка полей типа массив
    if (column.isArray || Array.isArray(value)) {
      if (Array.isArray(value)) {
        return `[${value.length} элементов]`;
      }
      return '[]';
    }
    
    // Обработка дат
    if (column.key === 'created_at' || column.key === 'updated_at' || column.key === 'time') {
      if (value && typeof value === 'string') {
        return new Date(value).toLocaleString();
      }
    }

    // Обработка Geometry полей
    if (column.isGeometry) {
      // Просто отображаем плейсхолдер, т.к. рендерить геометрию сложно
      return '[Координаты]';
    }
    
    // Обработка JSON полей (не мультиязычных и не обработанных ранее как FK или geometry)
    if ((column.isJsonb && !column.language) || (typeof value === 'object' && !Array.isArray(value))) {
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    
    // Вывод текстового значения (или других необработанных типов)
    return String(value); // Преобразуем в строку на всякий случай
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>
                    <Button
                      variant="ghost"
                      onClick={() => onSort(column.key)}
                      className="px-0 hover:bg-transparent"
                    >
                      {column.label}
                      {renderSortIcon(column.key)}
                    </Button>
                  </TableHead>
                ))}
                <TableHead className="w-[120px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                   <Button
                      variant="ghost"
                      onClick={() => onSort(column.key)}
                      className="px-0 hover:bg-transparent"
                    >
                      {column.label}
                      {renderSortIcon(column.key)}
                    </Button>
                </TableHead>
              ))}
              <TableHead className="w-[120px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  Нет данных для отображения
                </TableCell>
              </TableRow>
            ) : (
              data.map((record) => (
                <TableRow
                  key={record.id}
                  onClick={() => onEdit(record)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {formatCellData(record, column)}
                    </TableCell>
                  ))}
                  <TableCell className="space-x-2"> {/* Вернули space-x-2 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation(); // Предотвращаем всплытие события до TableRow
                        onEdit(record);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation(); // Предотвращаем всплытие события до TableRow
                        onDelete(record);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
