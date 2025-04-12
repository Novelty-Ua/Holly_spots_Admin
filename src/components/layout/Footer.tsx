
import React from 'react';
import { CheckCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/40 py-2 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>База данных: подключена</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Версия: 1.0.0</span>
          <span>© 2025 HolySpots Admin</span>
        </div>
      </div>
    </footer>
  );
};
