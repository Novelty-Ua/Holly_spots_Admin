
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

// --- LocalStorage Helpers ---
const LOCALSTORAGE_PREFIX = 'dashboard_';

function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(LOCALSTORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
}

function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCALSTORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
  }
}
// --- End LocalStorage Helpers ---

interface DashboardProps {
  activeTable: TableName;
  openEditSidebar: (record?: any) => void;
}

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeTable,
  openEditSidebar
}) => {
  const [data, setData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // Search query is typically not persisted
  // Load initial state from localStorage or use defaults
  const [language, setLanguage] = useState<string>(() => getFromLocalStorage('language', 'ru'));
  // Store filters per table
  const [allActiveFilters, setAllActiveFilters] = useState<Record<TableName, Record<string, string>>>(() =>
    getFromLocalStorage('allActiveFilters', {} as Record<TableName, Record<string, string>>)
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    getFromLocalStorage('columnVisibility', {})
  );
  // Combine sortKey and sortAscending into a single sortConfig state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(() =>
    getFromLocalStorage('sortConfig', null)
  );

  const { toast } = useToast();
  
  // Get columns for current table (memoized)
  const columns = React.useMemo(() => 
    getTableColumns(activeTable, language), 
    [activeTable, language]
  );

  // Initialize/update column visibility based on current columns and localStorage
  useEffect(() => {
    const currentTableColumns = getTableColumns(activeTable, language);
    // Load stored visibility again inside useEffect to ensure we have the latest after initial render
    const storedVisibility = getFromLocalStorage('columnVisibility', {});

    setColumnVisibility(prevCurrentVisibility => {
      const newVisibility: Record<string, boolean> = {};
      currentTableColumns.forEach(col => {
        // Prioritize stored value, then current state, then default
        const storedValue = storedVisibility[col.key];
        const currentValue = prevCurrentVisibility[col.key];
        const defaultValue = col.key === 'id' ? false : true;

        // Use stored value if available, otherwise use current value, otherwise use default
        newVisibility[col.key] = storedValue !== undefined ? storedValue : (currentValue !== undefined ? currentValue : defaultValue);
      });
      return newVisibility;
    });
    // No longer reset filters here to keep them persistent per table
  }, [activeTable, language]); // Rerun when table or language changes

  // Load data function (memoized with useCallback)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchTableData(activeTable, {
        page: currentPage,
        pageSize: 10,
      }, {
          search: searchQuery,
          language,
          filters: allActiveFilters[activeTable] || {}, // Use filters for the current table
          // Pass sort key and direction from sortConfig
          sortKey: sortConfig?.key,
          sortAscending: sortConfig?.direction === 'ascending'
      });
      
      setData(result.data);
      setTotalPages(result.totalPages);
      
      // Check if current page is still valid after filtering/searching
      // If the current page becomes invalid (e.g., > totalPages), reset to 1
      if (currentPage > result.totalPages && result.totalPages > 0) {
        setCurrentPage(1);
      } else if (result.totalPages === 0 && currentPage !== 1) {
        // Handle case where no results are found and we are not on page 1
        setCurrentPage(1);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Ошибка загрузки данных",
        description: `Не удалось загрузить данные для таблицы ${activeTable}`,
        variant: "destructive",
      });
      setData([]); // Clear data on error
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [activeTable, currentPage, searchQuery, language, allActiveFilters, sortConfig, toast]); // Update dependencies

  // --- Save state to localStorage on change ---
  useEffect(() => {
    saveToLocalStorage('language', language);
  }, [language]);

  useEffect(() => {
    saveToLocalStorage('allActiveFilters', allActiveFilters);
  }, [allActiveFilters]);

  useEffect(() => {
    // We need to save the potentially merged/updated visibility
    saveToLocalStorage('columnVisibility', columnVisibility);
  }, [columnVisibility]);

  useEffect(() => {
    saveToLocalStorage('sortConfig', sortConfig);
  }, [sortConfig]);
  // --- End Save state ---


  // Load data initially and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]); // Use loadData directly as dependency
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCurrentPage(1); // Reset page on language change
    // Optionally reset filters for all tables on language change, or just the current one
    // setAllActiveFilters({}); // Reset all filters
    // Or reset only current table's filters:
    // setAllActiveFilters(prev => ({ ...prev, [activeTable]: {} }));
  };

  // Handler for filter changes from TableControlPanel
  const handleFilterChange = (newFilters: Record<string, string>) => {
    // Update filters for the specific active table
    setAllActiveFilters(prev => ({ ...prev, [activeTable]: newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Renamed to handleSort and updates sortConfig state
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset page on sorting change
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
        setIsLoading(true); // Optionally set loading state during delete
        await deleteRecord(activeTable, recordToDelete.id);
        toast({
          title: "Запись удалена",
          description: `Запись #${recordToDelete.id} была успешно удалена.`,
        });
        // Adjust currentPage if the last item on a page was deleted
        if (data.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          loadData(); // Reload data on the potentially same page
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить запись.",
          variant: "destructive",
        });
      } finally {
         setIsLoading(false);
         setIsDeleteDialogOpen(false);
         setRecordToDelete(null);
      }
    } else {
       // Close dialog if recordToDelete is somehow null
        setIsDeleteDialogOpen(false);
        setRecordToDelete(null);
    }
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
    columns.filter(col => columnVisibility[col.key] !== false), // Show if true or undefined
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
        activeFilters={allActiveFilters[activeTable] || {}} // Pass filters for the current table
        // Remove sorting props from TableControlPanel
      />
      
      <DataTable
        data={data}
        columns={visibleColumns} // Use visible columns
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onView={handleView}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        sortConfig={sortConfig} // Pass sortConfig state
        onSort={handleSort} // Pass handleSort function
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
