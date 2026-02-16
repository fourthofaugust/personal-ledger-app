'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import TransactionForm from '@/components/TransactionForm';
import { useLedger } from '@/contexts/LedgerContext';

export default function AddTransactionFAB() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { addTransaction } = useLedger();

  const handleAddTransaction = async (transaction) => {
    try {
      await addTransaction(transaction);
      setIsSheetOpen(false);
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  return (
    <>
      {/* FAB Button - Visible on all screen sizes */}
      <Button
        size="lg"
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        onClick={() => setIsSheetOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Sheet that slides up from bottom */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
          <div className="px-6 py-4 border-b">
            <SheetHeader className="p-0">
              <SheetTitle>Add Transaction</SheetTitle>
              <SheetDescription>Add a new transaction to your ledger</SheetDescription>
            </SheetHeader>
          </div>
          <div className="px-6 py-6">
            <TransactionForm
              onSubmit={handleAddTransaction}
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
