'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export default function Footer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="border-t mt-auto">
      <div className="flex h-16 items-center px-6 justify-between">
        <div className="text-sm text-muted-foreground">
          Personal Ledger © {new Date().getFullYear()}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
