
import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { EditSidebar } from './EditSidebar';
import { TableName } from '@/services/supabaseService';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);
  const [activeTable, setActiveTable] = useState<TableName>('countries');
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleEditSidebar = () => {
    setEditSidebarOpen(!editSidebarOpen);
  };

  const openEditSidebar = (record?: any) => {
    setEditingRecord(record || null);
    setEditSidebarOpen(true);
  };

  const closeEditSidebar = () => {
    setEditSidebarOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          activeTable={activeTable}
          setActiveTable={setActiveTable}
        />
        
        <main className="flex-1 overflow-auto p-4">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { 
                activeTable, 
                openEditSidebar 
              });
            }
            return child;
          })}
        </main>
        
        <EditSidebar 
          isOpen={editSidebarOpen}
          onClose={closeEditSidebar}
          record={editingRecord}
          table={activeTable}
        />
      </div>
      
      <Footer />
    </div>
  );
};
