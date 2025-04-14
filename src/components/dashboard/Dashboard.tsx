
import React, { useState, useEffect } from 'react';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  
  // Get columns for current table
  const columns = getTableColumns(activeTable, language);

  // Initialize/update column visibility when table or language changes
  useEffect(() => {
    // Get columns for the current table and language inside the effect
    const currentTableColumns = getTableColumns(activeTable, language);
    
    setColumnVisibility(prevVisibility => {
      const newVisibility: Record<string, boolean> = {};
      currentTableColumns.forEach(col => {
        // Preserve existing visibility if the column key exists, otherwise default to true
        newVisibility[col.key] = prevVisibility[col.key] ?? true;
      });
      return newVisibility;
    });
  }, [activeTable, language]); // Rerun only when table or language changes

  // Load data based on current settings
  useEffect(() => {
    loadData();
  }, [activeTable, currentPage, searchQuery, language]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await fetchTableData(
        activeTable,
        { page: currentPage, pageSize: 10 },
        { search: searchQuery, language }
      );
      
      setData(result.data);
      setTotalPages(result.totalPages);
      
      // Reset to page 1 if changing tables
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
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
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
    // Для просмотра используем тот же редактор, но можно потом добавить режим read-only
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
        
        // Reload data
        loadData();
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

  // Filter columns based on visibility state
  const visibleColumns = columns.filter(col => columnVisibility[col.key]);
  
  return (
    <div className="space-y-4">
      <TableControlPanel
        table={activeTable as TableName}
        onSearch={handleSearch}
        onLanguageChange={handleLanguageChange}
        onAddRecord={handleAddRecord}
        columns={columns} // Pass all columns for the dropdown
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />
      
      <DataTable
        data={data}
        columns={visibleColumns} // Pass only visible columns to the table
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
