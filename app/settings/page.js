'use client';

import { useState, useRef, useMemo } from 'react';
import { useLedger } from '@/contexts/LedgerContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseLocalDate } from '@/lib/transactions';
import { Trash2, Download, Upload, Search, Filter, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/transactions';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Settings() {
  const { 
    transactions,
    savingsAccounts = [],
    fetchTransactions,
    fetchSavingsAccounts,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount
  } = useLedger();
  
  const { isPinSet, setupPin, resetPin, checkPinStatus } = useAuth();
  
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState({ income: true, expense: true, transfer: true });
  const [frequencyFilter, setFrequencyFilter] = useState({ daily: true, weekly: true, biweekly: true, monthly: true, quarterly: true, unknown: true });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Savings account form state
  const [savingsForm, setSavingsForm] = useState({ name: '', balance: '' });
  const [editingSavings, setEditingSavings] = useState(null);
  
  // PIN management state
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);

  // Group repeated transactions by company, amount, and frequency
  const repeatedTransactionGroups = useMemo(() => {
    const repeated = transactions.filter(t => t.tags && t.tags.includes('Repeated'));
    
    // Group by company and amount
    const groups = {};
    repeated.forEach(t => {
      const key = `${t.company}_${t.amount}_${t.type}`;
      if (!groups[key]) {
        groups[key] = {
          company: t.company,
          amount: t.amount,
          type: t.type,
          transactions: []
        };
      }
      groups[key].transactions.push(t);
    });
    
    // Calculate start date, end date, and frequency for each group
    const allGroups = Object.values(groups).map(group => {
      const sortedTransactions = group.transactions.sort((a, b) => 
        parseLocalDate(a.date) - parseLocalDate(b.date)
      );
      
      const startDate = sortedTransactions[0].date;
      const endDate = sortedTransactions[sortedTransactions.length - 1].date;
      const count = sortedTransactions.length;
      
      // Calculate frequency based on date differences
      let frequency = 'Unknown';
      if (count > 1) {
        const firstDate = parseLocalDate(sortedTransactions[0].date);
        const secondDate = parseLocalDate(sortedTransactions[1].date);
        const daysDiff = Math.round((secondDate - firstDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) frequency = 'Daily';
        else if (daysDiff >= 6 && daysDiff <= 8) frequency = 'Weekly';
        else if (daysDiff >= 13 && daysDiff <= 15) frequency = 'Bi-weekly';
        else if (daysDiff >= 27 && daysDiff <= 32) frequency = 'Monthly';
        else if (daysDiff >= 89 && daysDiff <= 93) frequency = 'Quarterly';
        else frequency = `Every ${daysDiff} days`;
      }
      
      return {
        ...group,
        startDate,
        endDate,
        count,
        frequency
      };
    });

    // Apply filters
    let filtered = allGroups.filter(group => {
      // Search filter
      const matchesSearch = group.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = 
        (typeFilter.income && group.type === 'Income') ||
        (typeFilter.expense && group.type === 'Expense') ||
        (typeFilter.transfer && group.type === 'Transfer');
      
      // Frequency filter
      const matchesFrequency = 
        (frequencyFilter.daily && group.frequency === 'Daily') ||
        (frequencyFilter.weekly && group.frequency === 'Weekly') ||
        (frequencyFilter.biweekly && group.frequency === 'Bi-weekly') ||
        (frequencyFilter.monthly && group.frequency === 'Monthly') ||
        (frequencyFilter.quarterly && group.frequency === 'Quarterly') ||
        (frequencyFilter.unknown && group.frequency === 'Unknown');
      
      return matchesSearch && matchesType && matchesFrequency;
    });

    return filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [transactions, searchQuery, typeFilter, frequencyFilter]);

  // Pagination
  const totalPages = Math.ceil(repeatedTransactionGroups.length / itemsPerPage);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return repeatedTransactionGroups.slice(startIndex, endIndex);
  }, [repeatedTransactionGroups, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, frequencyFilter, itemsPerPage]);

  const handleSavingsSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSavings) {
        await updateSavingsAccount(editingSavings.id, savingsForm);
        setEditingSavings(null);
      } else {
        await addSavingsAccount(savingsForm);
      }
      setSavingsForm({ name: '', balance: '' });
    } catch (err) {
      console.error('Failed to save savings account:', err);
    }
  };

  const handleEditSavings = (account) => {
    setEditingSavings(account);
    setSavingsForm({ name: account.name, balance: account.balance.toString() });
  };

  const handleDeleteSavings = async (id) => {
    if (confirm('Are you sure you want to delete this savings account?')) {
      try {
        await deleteSavingsAccount(id);
      } catch (err) {
        console.error('Failed to delete savings account:', err);
      }
    }
  };

  const handleCleanupAll = async () => {
    const confirmation = prompt(
      'This will permanently delete ALL transactions, templates, and savings accounts. Type "DELETE" to confirm:'
    );
    
    if (confirmation === 'DELETE') {
      try {
        const response = await fetch('/api/cleanup', {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(`Deleted ${result.data.transactionsDeleted} transactions, ${result.data.templatesDeleted} templates, and ${result.data.savingsAccountsDeleted} savings accounts`);
          await fetchTransactions();
          await fetchSavingsAccounts();
        } else {
          alert('Failed to cleanup data: ' + result.error);
        }
      } catch (err) {
        console.error('Failed to cleanup data:', err);
        alert('Failed to cleanup data');
      }
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup');
      const result = await response.json();
      
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to create backup: ' + result.error);
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
      alert('Failed to create backup');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      // Validate backup format
      if (!backup.data || !backup.data.transactions) {
        alert('Invalid backup file format');
        return;
      }
      
      const confirmation = confirm(
        `This will REPLACE all existing data with the backup.\n\n` +
        `Backup contains:\n` +
        `- ${backup.data.transactions.length} transactions\n` +
        `- ${backup.data.recurringTemplates?.length || 0} templates\n` +
        `- ${backup.data.savingsAccounts?.length || 0} savings accounts\n\n` +
        `Continue?`
      );
      
      if (!confirmation) return;
      
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(
          `Successfully restored:\n` +
          `- ${result.data.transactionsRestored} transactions\n` +
          `- ${result.data.templatesRestored || 0} templates\n` +
          `- ${result.data.savingsAccountsRestored || 0} savings accounts`
        );
        await fetchTransactions();
        await fetchSavingsAccounts();
      } else {
        alert('Failed to restore backup: ' + result.error);
      }
    } catch (err) {
      console.error('Failed to import backup:', err);
      alert('Failed to import backup. Please check the file format.');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (pinForm.newPin.length !== 6 || !/^\d+$/.test(pinForm.newPin)) {
      setPinError('PIN must be 6 digits');
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    try {
      let result;
      if (isPinSet) {
        // Change existing PIN
        result = await resetPin(pinForm.newPin, pinForm.securityAnswer);
      } else {
        // Setup new PIN
        if (!pinForm.securityQuestion.trim() || !pinForm.securityAnswer.trim()) {
          setPinError('Security question and answer are required');
          return;
        }
        result = await setupPin(pinForm.newPin, pinForm.securityQuestion, pinForm.securityAnswer);
      }

      if (result.success) {
        setPinSuccess(isPinSet ? 'PIN changed successfully' : 'PIN setup successfully');
        setPinForm({
          currentPin: '',
          newPin: '',
          confirmPin: '',
          securityQuestion: '',
          securityAnswer: ''
        });
        setShowPinForm(false);
        await checkPinStatus();
      } else {
        setPinError(result.error || 'Failed to update PIN');
      }
    } catch (error) {
      setPinError('An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 p-6 space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your ledger settings</p>
        </div>

        {/* Money Management Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Money Management</h3>
            <p className="text-sm text-muted-foreground">Savings and recurring transactions</p>
          </div>

          <Card>
          <CardHeader>
            <CardTitle>Savings Accounts</CardTitle>
            <CardDescription>Manage your savings accounts for reference</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavingsSubmit} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Account name"
                  value={savingsForm.name}
                  onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })}
                  required
                  autoComplete="off"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Balance"
                  value={savingsForm.balance}
                  onChange={(e) => setSavingsForm({ ...savingsForm, balance: e.target.value })}
                  required
                  autoComplete="off"
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingSavings ? 'Update' : 'Add'} Account
                  </Button>
                  {editingSavings && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditingSavings(null);
                        setSavingsForm({ name: '', balance: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </form>

            {savingsAccounts && savingsAccounts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savingsAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell className="text-right font-medium text-green-500">
                          {formatCurrency(account.balance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSavings(account)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSavings(account.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Total Savings</TableCell>
                      <TableCell className="text-right font-bold text-green-500">
                        {formatCurrency(savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No savings accounts added yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repeated Transactions</CardTitle>
            <CardDescription>View all recurring transaction series</CardDescription>
          </CardHeader>
          <CardContent>
            {repeatedTransactionGroups.length === 0 && searchQuery === '' && 
             Object.values(typeFilter).every(v => v) && Object.values(frequencyFilter).every(v => v) ? (
              <div className="text-center py-8 text-muted-foreground">
                No repeated transactions found
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by institution..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Type Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Type
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={typeFilter.income}
                        onCheckedChange={(checked) => setTypeFilter(prev => ({ ...prev, income: checked }))}
                      >
                        Income
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={typeFilter.expense}
                        onCheckedChange={(checked) => setTypeFilter(prev => ({ ...prev, expense: checked }))}
                      >
                        Expense
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={typeFilter.transfer}
                        onCheckedChange={(checked) => setTypeFilter(prev => ({ ...prev, transfer: checked }))}
                      >
                        Transfer
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Frequency Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Frequency
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Filter by Frequency</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={frequencyFilter.daily}
                        onCheckedChange={(checked) => setFrequencyFilter(prev => ({ ...prev, daily: checked }))}
                      >
                        Daily
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={frequencyFilter.weekly}
                        onCheckedChange={(checked) => setFrequencyFilter(prev => ({ ...prev, weekly: checked }))}
                      >
                        Weekly
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={frequencyFilter.biweekly}
                        onCheckedChange={(checked) => setFrequencyFilter(prev => ({ ...prev, biweekly: checked }))}
                      >
                        Bi-weekly
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={frequencyFilter.monthly}
                        onCheckedChange={(checked) => setFrequencyFilter(prev => ({ ...prev, monthly: checked }))}
                      >
                        Monthly
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={frequencyFilter.quarterly}
                        onCheckedChange={(checked) => setFrequencyFilter(prev => ({ ...prev, quarterly: checked }))}
                      >
                        Quarterly
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={frequencyFilter.unknown}
                        onCheckedChange={(checked) => setFrequencyFilter(prev => ({ ...prev, unknown: checked }))}
                      >
                        Unknown
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {paginatedGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No results found
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Institution</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedGroups.map((group, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{group.company}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{group.type}</Badge>
                              </TableCell>
                              <TableCell className={group.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                                {formatCurrency(group.amount)}
                              </TableCell>
                              <TableCell>{group.frequency}</TableCell>
                              <TableCell>{formatDate(group.startDate)}</TableCell>
                              <TableCell>{formatDate(group.endDate)}</TableCell>
                              <TableCell className="text-right">{group.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, repeatedTransactionGroups.length)} of {repeatedTransactionGroups.length} series
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Rows per page:</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8">
                                {itemsPerPage}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setItemsPerPage(10)}>
                                10
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setItemsPerPage(20)}>
                                20
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setItemsPerPage(30)}>
                                30
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            «
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            ‹
                          </Button>
                          <div className="flex items-center gap-1 px-2">
                            <span className="text-sm font-medium">{currentPage}</span>
                            <span className="text-muted-foreground text-sm">of</span>
                            <span className="text-sm font-medium">{totalPages || 1}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-8 w-8 p-0"
                          >
                            ›
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-8 w-8 p-0"
                          >
                            »
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Application Management Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Application Management</h3>
            <p className="text-sm text-muted-foreground">Security and access control</p>
          </div>

          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              PIN Security
            </CardTitle>
            <CardDescription>
              {isPinSet ? 'Change your PIN or security question' : 'Setup a PIN to secure your ledger'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPinForm ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">PIN Protection</p>
                    <p className="text-sm text-muted-foreground">
                      {isPinSet ? 'PIN is currently enabled' : 'No PIN set'}
                    </p>
                  </div>
                  <Button onClick={() => setShowPinForm(true)}>
                    {isPinSet ? 'Change PIN' : 'Setup PIN'}
                  </Button>
                </div>
                {pinSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{pinSuccess}</span>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pin">New PIN (6 digits)</Label>
                  <Input
                    id="new-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter new PIN"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirm PIN</Label>
                  <Input
                    id="confirm-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                    placeholder="Confirm new PIN"
                    autoComplete="off"
                    required
                  />
                </div>

                {!isPinSet && (
                  <>
                    <div className="border-t pt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Set a security question to recover your PIN if you forget it
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="security-question">Security Question</Label>
                        <Input
                          id="security-question"
                          type="text"
                          value={pinForm.securityQuestion}
                          onChange={(e) => setPinForm({ ...pinForm, securityQuestion: e.target.value })}
                          placeholder="e.g., What is your mother's maiden name?"
                          autoComplete="off"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="security-answer">Security Answer</Label>
                        <Input
                          id="security-answer"
                          type="text"
                          value={pinForm.securityAnswer}
                          onChange={(e) => setPinForm({ ...pinForm, securityAnswer: e.target.value })}
                          placeholder="Your answer"
                          autoComplete="off"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {isPinSet && (
                  <div className="space-y-2">
                    <Label htmlFor="security-answer-change">Security Answer (for verification)</Label>
                    <Input
                      id="security-answer-change"
                      type="text"
                      value={pinForm.securityAnswer}
                      onChange={(e) => setPinForm({ ...pinForm, securityAnswer: e.target.value })}
                      placeholder="Enter your security answer"
                      autoComplete="off"
                      required
                    />
                  </div>
                )}

                {pinError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowPinForm(false);
                      setPinForm({
                        currentPin: '',
                        newPin: '',
                        confirmPin: '',
                        securityQuestion: '',
                        securityAnswer: ''
                      });
                      setPinError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isPinSet ? 'Change PIN' : 'Setup PIN'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Data Management Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Data Management</h3>
            <p className="text-sm text-muted-foreground">Backup, restore, and delete data</p>
          </div>

          <Card>
          <CardHeader>
            <CardTitle>Backup & Restore</CardTitle>
            <CardDescription>Export or import your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all transactions as JSON
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={handleBackup}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Import Data</p>
                <p className="text-sm text-muted-foreground">
                  Restore from a backup file (replaces existing data)
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button 
                  variant="outline"
                  onClick={handleImportClick}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Backup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions that affect all your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
              <div>
                <p className="font-medium">Delete All Data</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all transactions, templates, and savings accounts
                </p>
              </div>
              <Button 
                variant="destructive"
                onClick={handleCleanupAll}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Everything
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
