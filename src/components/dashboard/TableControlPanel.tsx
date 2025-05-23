
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
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
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
import { cn } from "@/lib/utils"; // Import cn utility

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
  activeFilters: Record<string, string>; // Add activeFilters prop
  // Remove sorting related props
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
  activeFilters // Destructure activeFilters
  // Remove sorting related props from destructuring
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // Remove internal filters state and useEffect

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterInputChange = (columnKey: string, value: string) => {
    // Create the new filters state based on the current activeFilters and the change
    const newFilters = {
      ...activeFilters, // Use the passed-in activeFilters
      [columnKey]: value,
    };
    onFilterChange(newFilters); // Call the callback with the complete new state
  };

  // Check if any filter value is active using the passed-in activeFilters
  const isAnyFilterActive = Object.values(activeFilters).some(value => value);

  // Remove sortableColumns calculation as it's no longer needed here

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
              <Button
                variant={isAnyFilterActive ? "destructive" : "outline"}
                size="icon"
                className="h-9 w-9"
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">Фильтр</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Фильтры</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {columns.map((column) => (
                    // Exclude only created_at and updated_at from having filter inputs/toggles
                    (column.key !== 'created_at' && column.key !== 'updated_at') ? (
                      <div key={column.key} className="flex items-center gap-3">
                        {/* Checkbox for visibility */}
                        <Checkbox
                          id={`visibility-${column.key}`}
                          checked={columnVisibility[column.key] ?? true} // Default to visible
                          onCheckedChange={(checked) => onColumnVisibilityChange(column.key, !!checked)}
                          aria-label={`Показать/скрыть колонку ${column.label}`}
                        />
                        {/* Label and Input */}
                        <div className="flex-1 grid grid-cols-3 items-center gap-2">
                           <Label htmlFor={`filter-${column.key}`} className="col-span-1 text-sm truncate cursor-pointer">
                            {column.label}
                          </Label>
                          <Input
                            id={`filter-${column.key}`}
                            placeholder={`Фильтр...`}
                            value={activeFilters[column.key] || ''} // Use activeFilters prop for value
                            onChange={(e) => handleFilterInputChange(column.key, e.target.value)}
                            className="col-span-2 h-8 bg-muted/20"
                          />
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Remove Sorting Popover */}

          {/* Remove the separate Column Visibility Dropdown */}

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
