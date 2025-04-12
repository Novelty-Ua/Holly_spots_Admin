
import React from 'react';
import { 
  Globe, 
  MapPin, 
  Landmark, 
  Route, 
  Calendar, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  activeTable: string;
  setActiveTable: (table: string) => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'countries', name: 'Страны', icon: Globe },
  { id: 'cities', name: 'Города', icon: MapPin },
  { id: 'spots', name: 'Объекты', icon: Landmark },
  { id: 'routes', name: 'Маршруты', icon: Route },
  { id: 'events', name: 'События', icon: Calendar },
  { id: 'users', name: 'Пользователи', icon: Users },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  activeTable,
  setActiveTable
}) => {
  return (
    <aside 
      className={`h-[calc(100vh-4rem)] bg-sidebar transition-all duration-300 border-r border-sidebar-border ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-6 px-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTable(item.id)}
                  className={`sidebar-item w-full justify-start ${
                    activeTable === item.id ? 'active' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};
