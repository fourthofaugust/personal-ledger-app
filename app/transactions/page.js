'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLedger } from '@/contexts/LedgerContext';
import { parseLocalDate } from '@/lib/transactions';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import TransactionsDataTable from '@/components/TransactionsDataTable';
import TransactionForm from '@/components/TransactionForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Transactions() {
  const { 
    transactions, 
    isLoading, 
    error,
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    processRecurringTransactions
  } = useLedger();
  
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    // Try to load saved date range from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transactions-date-range');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            from: new Date(parsed.from),
            to: new Date(parsed.to)
          };
        } catch (e) {
          // If parsing fails, use default
        }
      }
    }
    // Default to current month
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return {
      from: today,
      to: endOfMonth(today)
    };
  });
  const [hasProcessed, setHasProcessed] = useState(false);

  // Save date range to localStorage whenever it changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      localStorage.setItem('transactions-date-range', JSON.stringify({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      }));
    }
  }, [dateRange]);

  // Automatically process recurring transactions when component mounts (only once)
  useEffect(() => {
    if (hasProcessed) return;
    
    const processRecurring = async () => {
      try {
        await processRecurringTransactions();
        setHasProcessed(true);
      } catch (err) {
        console.error('Failed to process recurring transactions:', err);
      }
    };
    
    processRecurring();
  }, [hasProcessed, processRecurringTransactions]);

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(t => {
      const transactionDate = parseLocalDate(t.date);
      return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    }).sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
    
    return filtered;
  }, [transactions, dateRange]);

  const handleAddTransaction = async (transaction) => {
    try {
      await addTransaction(transaction);
      setIsSheetOpen(false);
      setEditingTransaction(null);
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const handleUpdateTransaction = async (transaction) => {
    try {
      await updateTransaction(editingTransaction.id, transaction);
      setEditingTransaction(null);
      setIsSheetOpen(false);
    } catch (err) {
      console.error('Failed to update transaction:', err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    }
  };

  const handleBulkDelete = async (ids) => {
    if (confirm(`Delete ${ids.length} selected transaction${ids.length > 1 ? 's' : ''}?`)) {
      try {
        await Promise.all(ids.map(id => deleteTransaction(id)));
      } catch (err) {
        console.error('Failed to delete transactions:', err);
      }
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await updateTransaction(id, { paid: true });
    } catch (err) {
      console.error('Failed to mark transaction as paid:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-3xl font-bold">Transactions</h2>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
                    </>
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      // Always set dates to noon local time
                      const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 12, 0, 0);
                      const to = range.to 
                        ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 12, 0, 0)
                        : from;
                      setDateRange({ from, to });
                    }
                  }}
                  numberOfMonths={1}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nothing to see here right now.
              </div>
            ) : (
              <TransactionsDataTable
                transactions={filteredTransactions}
                allTransactions={transactions}
                onEdit={(transaction) => {
                  setEditingTransaction(transaction);
                  setIsSheetOpen(true);
                }}
                onDelete={handleDeleteTransaction}
                onBulkDelete={handleBulkDelete}
                onMarkPaid={handleMarkPaid}
              />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Transaction Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
          <div className="px-6 py-4 border-b">
            <SheetHeader className="p-0">
              <SheetTitle>Edit Transaction</SheetTitle>
              <SheetDescription>Update transaction details</SheetDescription>
            </SheetHeader>
          </div>
          <div className="px-6 py-6">
            <TransactionForm
              transaction={editingTransaction}
              onSubmit={handleUpdateTransaction}
              onCancel={() => {
                setEditingTransaction(null);
                setIsSheetOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      <Footer />
    </div>
  );
}
