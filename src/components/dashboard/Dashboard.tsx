
import React, { useState, useEffect } from 'react';
import { TableControlPanel } from './TableControlPanel';
import { DataTable } from './DataTable';
import { 
  getPaginatedData,
  tableColumns,
  deleteRecord,
  updateRecord,
  createRecord
} from '@/services/mockDataService';
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

interface DashboardProps {
  activeTable: string;
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
  
  const { toast } = useToast();
  
  // Load data based on current settings
  useEffect(() => {
    loadData();
  }, [activeTable, currentPage, searchQuery, language]);
  
  const loadData = () => {
    const result = getPaginatedData(
      activeTable,
      currentPage,
      10,
      searchQuery,
      language
    );
    
    setData(result.data);
    setTotalPages(result.pagination.totalPages);
    
    // Reset to page 1 if changing tables
    if (currentPage > result.pagination.totalPages) {
      setCurrentPage(1);
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
    // For now, just edit view
    openEditSidebar(record);
  };
  
  const handleDeleteClick = (record: any) => {
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (recordToDelete) {
      const result = deleteRecord(activeTable, recordToDelete.id);
      
      if (result) {
        toast({
          title: "Запись удалена",
          description: `Запись #${recordToDelete.id} была успешно удалена.`,
        });
        
        // Reload data
        loadData();
      } else {
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
  
  // Get columns for current table
  const columns = tableColumns[activeTable] || [];
  
  return (
    <div className="space-y-4">
      <TableControlPanel 
        table={activeTable}
        onSearch={handleSearch}
        onLanguageChange={handleLanguageChange}
        onAddRecord={handleAddRecord}
      />
      
      <DataTable 
        data={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onView={handleView}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
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
