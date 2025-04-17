
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import {
  Filter,
  Search,
  SlidersHorizontal,
  Plus,
  Columns,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  isJsonb?: boolean;
  isGeometry?: boolean;
  isArray?: boolean;
}

interface TableControlPanelProps {  
  table: string;
  columns: Column[];
  columnVisibility: Record<string, boolean>;
  onSearch: (query: string) => void;
  onLanguageChange: (lang: string) => void;
  onAddRecord: () => void;
  onColumnVisibilityChange: (columnKey: string, isVisible: boolean) => void;
  onFilterChange: (filters: Record<string, string>) => void;
  onSortChange: (key: string | null, ascending: boolean) => void; 
  sortKey: string | null;
  sortAscending: boolean;
}

export const TableControlPanel: React.FC<TableControlPanelProps> = ({
  table,
  onSearch,
  onLanguageChange,
  onAddRecord,
  columns,
  columnVisibility,
  onColumnVisibilityChange,  
  onFilterChange,
  onSortChange,
  sortKey,
  sortAscending
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({}); 

  useEffect(() => {
    setFilters(prevFilters => {
      const validKeys = new Set(columns.map(c => c.key));
      return Object.fromEntries(Object.entries(prevFilters).filter(([k]) => validKeys.has(k)));
    });
  }, [columns]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterInputChange = (columnKey: string, value: string) => {
    const newFilters = {
      ...filters,
      [columnKey]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const sortableColumns = columns.filter(col =>
      col.sortable !== false && 
      !col.isJsonb &&           
      !col.isGeometry &&        
      !col.isArray &&           
      col.key !== 'id' &&       
      col.key !== 'created_at' && 
      col.key !== 'updated_at'
  );

  return (
    <div className="bg-card rounded-lg border border-border/40 p-4 mb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Поиск по таблице ${table}...`}
              className="pl-8 w-full md:w-[300px] bg-muted/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Language Select */}
          <Select defaultValue="ru" onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Язык" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Фильтр</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Фильтры</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {columns.map((column) => (
                    (column.key !== 'id' && column.key !== 'created_at' && column.key !== 'updated_at') ? (
                      <div key={column.key} className="grid grid-cols-3 items-center gap-2">
                         <Label htmlFor={`filter-${column.key}`} className="col-span-1 text-sm truncate">
                          {column.label}
                        </Label>
                        <Input
                          id={`filter-${column.key}`}
                          placeholder={`Фильтр по ${column.label}...`}
                          value={filters[column.key] || ''}
                          onChange={(e) => handleFilterInputChange(column.key, e.target.value)}
                          className="col-span-2 h-8 bg-muted/20"
                        />
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sorting Popover - RadioGroup temporarily commented out */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Сортировка</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Сортировка</h4>

                {/* Column Selection */} 
                <div className="grid grid-cols-3 items-center gap-2">
                   <Label htmlFor="sort-column" className="col-span-1 text-sm">
                      Колонка
                   </Label>
                   <Select
                      value={sortKey ?? ""} 
                      onValueChange={(newKey) => {
                           onSortChange(newKey === "" ? null : newKey, sortAscending);
                      }}
                   >
                     <SelectTrigger id="sort-column" className="col-span-2 h-8">
                       <SelectValue placeholder="Выберите колонку" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="">Без сортировки</SelectItem>
                        {sortableColumns.map((column) => (
                          <SelectItem key={column.key} value={column.key}>
                            {column.label}
                          </SelectItem>
                         ))}
                     </SelectContent>
                   </Select>
                </div>

                {/* --- Direction Selection Temporarily Commented Out --- */}
                {/* 
                {sortKey && ( 
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label className="col-span-1 text-sm">
                        Направление
                    </Label>
                    <RadioGroup
                      value={sortAscending ? "true" : "false"}
                      onValueChange={(value) => {
                         if (sortKey) {
                           onSortChange(sortKey, value === "true"); 
                         }
                      }}
                      className="col-span-2 flex space-x-2"
                    >
                       <div className="flex items-center space-x-1">
                         <RadioGroupItem value="true" id="sort-asc" />
                         <Label htmlFor="sort-asc" className="text-sm font-normal cursor-pointer">По возр.</Label>
                       </div>
                       <div className="flex items-center space-x-1">
                         <RadioGroupItem value="false" id="sort-desc" />
                         <Label htmlFor="sort-desc" className="text-sm font-normal cursor-pointer">По убыв.</Label>
                       </div>
                    </RadioGroup>
                  </div>
                )}
                */}
                {/* --- End Commented Out Section --- */}
                
              </div>
            </PopoverContent>
          </Popover>

          {/* Column Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Columns className="h-4 w-4" />
                <span className="sr-only">Колонки</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={columnVisibility[column.key] ?? true}
                  onCheckedChange={(checked) => onColumnVisibilityChange(column.key, !!checked)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Button */}
          <Button onClick={onAddRecord} className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Добавить</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
