
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

interface Column {
  key: string;
  label: string;
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
}) => {
  const formatCellValue = (row: any, column: Column) => {
    const value = row[column.key];
    
    // Handle JSON values (for multilingual content)
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    // Handle arrays (like photos)
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      if (value[0].includes('.jpg') || value[0].includes('.png') || value[0].includes('.jpeg')) {
        return <span className="text-blue-400">{value.length} изображений</span>;
      }
      return value.join(', ').substring(0, 50) + (value.join(', ').length > 50 ? '...' : '');
    }
    
    // Truncate long text values
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return value === undefined ? '-' : value;
  };
  
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
