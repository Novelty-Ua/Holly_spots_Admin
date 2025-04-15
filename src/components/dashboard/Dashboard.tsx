
import React, { useState, useEffect, useCallback } from 'react';
import { TableName } from '@/services/supabaseService';
import { TableControlPanel } from './TableControlPanel';
import { DataTable } from './DataTable';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchTableData,
  getTableColumns,
  deleteRecord
} from '@/services/supabaseService';

interface DashboardProps {
  activeTable: TableName;
  openEditSidebar: (record?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  activeTable,
  openEditSidebar
}) => {
  const [data, setData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('ru');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({}); // Added state for filters
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  
  // Get columns for current table (memoized)
  const columns = React.useMemo(() => 
    getTableColumns(activeTable, language), 
    [activeTable, language]
  );

  // Initialize/update column visibility when table or language changes
  useEffect(() => {
    const currentTableColumns = getTableColumns(activeTable, language);
    setColumnVisibility(prevVisibility => {
      const newVisibility: Record<string, boolean> = {};
      currentTableColumns.forEach(col => {
        newVisibility[col.key] = prevVisibility[col.key] ?? true;
      });
      return newVisibility;
    });
  }, [activeTable, language]);

  // Load data function (memoized with useCallback)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchTableData(
        activeTable,
        { page: currentPage, pageSize: 10 },
        { search: searchQuery, language, filters: activeFilters } // Pass filters here
      );
      
      setData(result.data);
      setTotalPages(result.totalPages);
      
      // Check if current page is still valid after filtering/searching
      if (currentPage > result.totalPages) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Ошибка загрузки данных",
        description: `Не удалось загрузить данные для таблицы ${activeTable}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTable, currentPage, searchQuery, language, activeFilters, toast]); // Add activeFilters dependency

  // Load data when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]); // Use loadData directly as dependency
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // Data will reload via useEffect dependency change
  };

  // Handler for filter changes from TableControlPanel
  const handleFilterChange = (newFilters: Record<string, string>) => {
    setActiveFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleAddRecord = () => {
    openEditSidebar();
  };
  
  const handleEdit = (record: any) => {
    openEditSidebar(record);
  };
  
  const handleView = (record: any) => {
    openEditSidebar(record);
  };
  
  const handleDeleteClick = (record: any) => {
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteRecord(activeTable, recordToDelete.id);
        toast({
          title: "Запись удалена",
          description: `Запись #${recordToDelete.id} была успешно удалена.`,
        });
        loadData(); // Reload data after delete
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить запись.",
          variant: "destructive",
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setRecordToDelete(null);
  };
  
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  const handleColumnVisibilityChange = (columnKey: string, isVisible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: isVisible,
    }));
  };

  // Filter columns based on visibility state (memoized)
  const visibleColumns = React.useMemo(() => 
    columns.filter(col => columnVisibility[col.key]),
    [columns, columnVisibility]
  );
  
  return (
    <div className="space-y-4">
      <TableControlPanel
        table={activeTable as TableName}
        onSearch={handleSearch}
        onLanguageChange={handleLanguageChange}
        onAddRecord={handleAddRecord}
        columns={columns} 
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onFilterChange={handleFilterChange} // Pass the new handler
      />
      
      <DataTable
        data={data}
        columns={visibleColumns}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onView={handleView}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить запись #{recordToDelete?.id}?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
