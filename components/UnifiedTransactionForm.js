'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toDateString, getCurrentDate } from '@/lib/dateUtils';

export default function UnifiedTransactionForm({ transaction, template, onSubmitTransaction, onSubmitTemplate, onCancel }) {
  const [activeTab, setActiveTab] = useState('one-time');
  
  const [transactionData, setTransactionData] = useState({
    date: getCurrentDate(),
    type: 'Expense',
    amount: '',
    company: '',
    paid: true,
    repeat: false,
    repeatFrequency: 'monthly',
    repeatUntil: new Date(getCurrentDate().getFullYear(), 11, 31) // End of current year
  });

  const [templateData, setTemplateData] = useState({
    type: 'Expense',
    company: '',
    paid: true,
    amountType: 'fixed',
    amount: '',
    estimatedAmount: '',
    tags: [],
    recurrencePattern: {
      frequency: 'monthly',
      dayOfMonth: 1,
      dayOfWeek: 0,
      customDates: []
    }
  });

  useEffect(() => {
    if (transaction) {
      setActiveTab('one-time');
      setTransactionData({
        date: new Date(transaction.date),
        type: transaction.type,
        amount: Math.abs(transaction.amount).toString(),
        company: transaction.company,
        paid: transaction.paid,
        repeat: false,
        repeatFrequency: 'monthly',
        repeatUntil: new Date(new Date().getFullYear(), 11, 31)
      });
    }
    if (template) {
      setActiveTab('recurring');
      setTemplateData({
        type: template.type,
        company: template.company,
        paid: template.paid,
        amountType: template.amountType,
        amount: template.amount ? Math.abs(template.amount).toString() : '',
        estimatedAmount: template.estimatedAmount ? Math.abs(template.estimatedAmount).toString() : '',
        tags: template.tags || [],
        recurrencePattern: template.recurrencePattern
      });
    }
  }, [transaction, template]);

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    
    const dateString = toDateString(transactionData.date);
    console.log('Transaction date conversion:', {
      originalDate: transactionData.date,
      dateString: dateString
    });
    
    const data = {
      ...transactionData,
      date: dateString,
      amount: transactionData.amount ? parseFloat(transactionData.amount) : 0,
      repeat: transactionData.repeat,
      repeatFrequency: transactionData.repeat ? transactionData.repeatFrequency : undefined,
      repeatUntil: transactionData.repeat ? toDateString(transactionData.repeatUntil) : undefined
    };
    
    console.log('Submitting transaction data:', data);
    onSubmitTransaction(data);
  };

  const handleTemplateSubmit = (e) => {
    e.preventDefault();
    const data = {
      type: templateData.type,
      company: templateData.company,
      paid: templateData.paid,
      amountType: templateData.amountType,
      tags: templateData.tags,
      recurrencePattern: templateData.recurrencePattern
    };

    if (templateData.amountType === 'fixed') {
      data.amount = parseFloat(templateData.amount);
    } else {
      data.amount = null;
      if (templateData.estimatedAmount) {
        data.estimatedAmount = parseFloat(templateData.estimatedAmount);
      }
    }
    
    onSubmitTemplate(data);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="one-time">One-Time Transaction</TabsTrigger>
        <TabsTrigger value="recurring">Recurring Transaction</TabsTrigger>
      </TabsList>
      
      <TabsContent value="one-time">
        <form onSubmit={handleTransactionSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !transactionData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionData.date ? format(transactionData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transactionData.date}
                    onSelect={(date) => {
                      if (date) {
                        // Always set to noon local time to avoid timezone issues
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                        setTransactionData({ ...transactionData, date: localDate });
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
              <Label htmlFor="type">Type</Label>
              <Select value={transactionData.type} onValueChange={(value) => setTransactionData({ ...transactionData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount {transactionData.repeat && <span className="text-muted-foreground text-xs">(optional for repeated transactions)</span>}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={transactionData.amount}
                onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                placeholder={transactionData.repeat ? "Leave empty if unknown" : "0.00"}
                autoComplete="off"
                required={!transactionData.repeat}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                type="text"
                value={transactionData.company}
                onChange={(e) => setTransactionData({ ...transactionData, company: e.target.value })}
                placeholder="Company name"
                autoComplete="off"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="paid"
              checked={transactionData.paid}
              onCheckedChange={(checked) => setTransactionData({ ...transactionData, paid: checked })}
            />
            <Label htmlFor="paid">Paid</Label>
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="repeat"
                checked={transactionData.repeat}
                onCheckedChange={(checked) => setTransactionData({ ...transactionData, repeat: checked })}
              />
              <Label htmlFor="repeat">Repeat this transaction</Label>
            </div>

            {transactionData.repeat && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="repeatFrequency">Frequency</Label>
                  <Select 
                    value={transactionData.repeatFrequency} 
                    onValueChange={(value) => setTransactionData({ ...transactionData, repeatFrequency: value })}
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
                          !transactionData.repeatUntil && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {transactionData.repeatUntil ? format(transactionData.repeatUntil, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={transactionData.repeatUntil}
                        onSelect={(date) => {
                          if (date) {
                            // Always set to noon local time to avoid timezone issues
                            const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                            setTransactionData({ ...transactionData, repeatUntil: localDate });
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
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {transaction ? 'Update' : 'Add'} Transaction
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </TabsContent>
      
      <TabsContent value="recurring">
        <form onSubmit={handleTemplateSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-type">Type</Label>
              <Select value={templateData.type} onValueChange={(value) => setTemplateData({ ...templateData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-company">Company</Label>
              <Input
                id="template-company"
                value={templateData.company}
                onChange={(e) => setTemplateData({ ...templateData, company: e.target.value })}
                placeholder="Company name"
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountType">Amount Type</Label>
              <Select value={templateData.amountType} onValueChange={(value) => setTemplateData({ ...templateData, amountType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="variable">Variable Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {templateData.amountType === 'fixed' ? (
              <div className="space-y-2">
                <Label htmlFor="template-amount">Amount</Label>
                <Input
                  id="template-amount"
                  type="number"
                  step="0.01"
                  value={templateData.amount}
                  onChange={(e) => setTemplateData({ ...templateData, amount: e.target.value })}
                  placeholder="0.00"
                  autoComplete="off"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="estimatedAmount">Estimated Amount (Optional)</Label>
                <Input
                  id="estimatedAmount"
                  type="number"
                  step="0.01"
                  value={templateData.estimatedAmount}
                  onChange={(e) => setTemplateData({ ...templateData, estimatedAmount: e.target.value })}
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select 
                value={templateData.recurrencePattern.frequency} 
                onValueChange={(value) => setTemplateData({ 
                  ...templateData, 
                  recurrencePattern: { ...templateData.recurrencePattern, frequency: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {templateData.recurrencePattern.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={templateData.recurrencePattern.dayOfMonth}
                  onChange={(e) => setTemplateData({ 
                    ...templateData, 
                    recurrencePattern: { ...templateData.recurrencePattern, dayOfMonth: parseInt(e.target.value) }
                  })}
                  autoComplete="off"
                  required
                />
              </div>
            )}
            
            {templateData.recurrencePattern.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select 
                  value={templateData.recurrencePattern.dayOfWeek.toString()} 
                  onValueChange={(value) => setTemplateData({ 
                    ...templateData, 
                    recurrencePattern: { ...templateData.recurrencePattern, dayOfWeek: parseInt(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {templateData.recurrencePattern.frequency === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customDates">Days (comma-separated)</Label>
                <Input
                  id="customDates"
                  value={templateData.recurrencePattern.customDates.join(',')}
                  onChange={(e) => setTemplateData({ 
                    ...templateData, 
                    recurrencePattern: { 
                      ...templateData.recurrencePattern, 
                      customDates: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                    }
                  })}
                  placeholder="1,15,30"
                  autoComplete="off"
                  required
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="template-paid"
              checked={templateData.paid}
              onCheckedChange={(checked) => setTemplateData({ ...templateData, paid: checked })}
            />
            <Label htmlFor="template-paid">Paid by default</Label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {template ? 'Update' : 'Create'} Template
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
