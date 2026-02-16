'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLedger } from '@/contexts/LedgerContext';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransactionForm({ transaction, onSubmit, onCancel }) {
  const { transactions } = useLedger();
  
  const [formData, setFormData] = useState({
    date: new Date(),
    type: 'Expense',
    amount: '',
    company: '',
    paid: true,
    tags: [],
    repeat: false,
    repeatFrequency: 'monthly',
    repeatUntil: new Date(new Date().getFullYear(), 11, 31)
  });

  const [tagInput, setTagInput] = useState('');
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [recurringEditMode, setRecurringEditMode] = useState('this'); // 'this' or 'future'

  // Check if this is a repeated transaction
  const isRepeatedTransaction = transaction && transaction.tags && transaction.tags.includes('Repeated');

  // Get unique company names from existing transactions
  const companySuggestions = useMemo(() => {
    const companies = [...new Set(transactions.map(t => t.company))];
    return companies.filter(c => 
      c.toLowerCase().includes(formData.company.toLowerCase())
    ).slice(0, 5);
  }, [transactions, formData.company]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: new Date(transaction.date),
        type: transaction.type,
        amount: Math.abs(transaction.amount).toString(),
        company: transaction.company,
        paid: transaction.paid,
        tags: transaction.tags || [],
        repeat: false,
        repeatFrequency: 'monthly',
        repeatUntil: new Date(new Date().getFullYear(), 11, 31)
      });
      
      // Show recurring options dialog if this is a repeated transaction
      if (transaction.tags && transaction.tags.includes('Repeated')) {
        setShowRecurringOptions(true);
      }
    }
  }, [transaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If editing a repeated transaction, include the edit mode
    const data = {
      ...formData,
      date: format(formData.date, 'yyyy-MM-dd'),
      amount: formData.amount ? parseFloat(formData.amount) : 0,
      repeat: formData.repeat,
      repeatFrequency: formData.repeat ? formData.repeatFrequency : undefined,
      repeatUntil: formData.repeat ? format(formData.repeatUntil, 'yyyy-MM-dd') : undefined
    };
    
    if (isRepeatedTransaction) {
      data.recurringEditMode = recurringEditMode;
    }
    
    onSubmit(data);
  };

  const handleRecurringOptionSelect = (mode) => {
    setRecurringEditMode(mode);
    setShowRecurringOptions(false);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleCompanySelect = (company) => {
    setFormData({ ...formData, company });
    setShowCompanySuggestions(false);
  };

  return (
    <>
      {/* Recurring Transaction Edit Options Dialog */}
      <Dialog open={showRecurringOptions} onOpenChange={setShowRecurringOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Transaction</DialogTitle>
            <DialogDescription>
              This is a repeated transaction. How would you like to edit it?
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={recurringEditMode} onValueChange={handleRecurringOptionSelect} className="space-y-3">
            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => handleRecurringOptionSelect('this')}>
              <RadioGroupItem value="this" id="this" />
              <Label htmlFor="this" className="cursor-pointer flex-1">
                <div className="font-medium">Edit this occurrence only</div>
                <div className="text-sm text-muted-foreground">Changes will only apply to this transaction</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => handleRecurringOptionSelect('future')}>
              <RadioGroupItem value="future" id="future" />
              <Label htmlFor="future" className="cursor-pointer flex-1">
                <div className="font-medium">Edit this and future occurrences</div>
                <div className="text-sm text-muted-foreground">Changes will apply to this and all future transactions in the series</div>
              </Label>
            </div>
          </RadioGroup>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2 flex-1">
          <Label>Type</Label>
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Income' })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                formData.type === 'Income'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Expense' })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                formData.type === 'Expense'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Transfer' })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                formData.type === 'Transfer'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Transfer
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pb-2">
          <Switch
            id="paid"
            checked={formData.paid}
            onCheckedChange={(checked) => setFormData({ ...formData, paid: checked })}
          />
          <Label htmlFor="paid">Paid</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                    setFormData({ ...formData, date: localDate });
                  }
                }}
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={2030}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount {formData.repeat && <span className="text-muted-foreground text-xs">(optional for repeated transactions)</span>}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder={formData.repeat ? "Leave empty if unknown" : "0.00"}
            autoComplete="off"
            required={!formData.repeat}
          />
        </div>
        
        <div className="space-y-2 relative sm:col-span-2">
          <Label htmlFor="company">Institution</Label>
          <Input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => {
              setFormData({ ...formData, company: e.target.value });
              setShowCompanySuggestions(true);
            }}
            onFocus={() => setShowCompanySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
            placeholder="Institution name"
            autoComplete="off"
            required
          />
          {showCompanySuggestions && companySuggestions.length > 0 && formData.company && (
            <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
              {companySuggestions.map((company, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                  onClick={() => handleCompanySelect(company)}
                >
                  {company}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type and press Enter to add tags"
          autoComplete="off"
        />
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="pl-2 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2 border-t">
        <div className="flex items-center space-x-2">
          <Switch
            id="repeat"
            checked={formData.repeat}
            onCheckedChange={(checked) => setFormData({ ...formData, repeat: checked })}
          />
          <Label htmlFor="repeat">Repeat this transaction</Label>
        </div>

        {formData.repeat && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label htmlFor="repeatFrequency">Frequency</Label>
              <Select 
                value={formData.repeatFrequency} 
                onValueChange={(value) => setFormData({ ...formData, repeatFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeatUntil">Repeat Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.repeatUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.repeatUntil ? format(formData.repeatUntil, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.repeatUntil}
                    onSelect={(date) => {
                      if (date) {
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                        setFormData({ ...formData, repeatUntil: localDate });
                      }
                    }}
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2030}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
        
      <div className="flex flex-col gap-3 pt-4">
        <Button type="submit" className="w-full" size="lg">
          {transaction ? 'Update' : 'Add'} Transaction
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="w-full" size="lg">
            Cancel
          </Button>
        )}
      </div>
    </form>
    </>
  );
}
