'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Menu, Home, CreditCard, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isPinSet, logout } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Wallet className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Personal Ledger</h1>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="ml-auto hidden md:flex items-center space-x-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="cursor-pointer">
              <Button 
                variant={pathname === item.href ? 'default' : 'ghost'}
                size="sm"
                className="cursor-pointer"
              >
                {item.label}
              </Button>
            </Link>
          ))}
          {isPinSet && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="ml-auto md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <SheetHeader className="p-6 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-6 w-6" />
                    <SheetTitle className="text-lg font-semibold">Personal Ledger</SheetTitle>
                  </div>
                </SheetHeader>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 pt-4">
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                          <Button 
                            variant={isActive ? 'secondary' : 'ghost'}
                            className="w-full justify-start h-12 text-base"
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.label}
                          </Button>
                        </Link>
                      );
                    })}
                    {isPinSet && (
                      <Button 
                        variant="ghost"
                        className="w-full justify-start h-12 text-base"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                      </Button>
                    )}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
