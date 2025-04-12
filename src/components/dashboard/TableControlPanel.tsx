
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Columns
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TableControlPanelProps {
  table: string;
  onSearch: (query: string) => void;
  onLanguageChange: (lang: string) => void;
  onAddRecord: () => void;
}

export const TableControlPanel: React.FC<TableControlPanelProps> = ({
  table,
  onSearch,
  onLanguageChange,
  onAddRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  return (
    <div className="bg-card rounded-lg border border-border/40 p-4 mb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                <div className="space-y-2">
                  <p className="text-sm">Настройка фильтров будет зависеть от структуры выбранной таблицы</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
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
                <div className="space-y-2">
                  <p className="text-sm">Настройка сортировки будет зависеть от структуры выбранной таблицы</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Columns className="h-4 w-4" />
                <span className="sr-only">Колонки</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem checked>ID</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Название</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Описание</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Создано</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={onAddRecord} className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Добавить</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
