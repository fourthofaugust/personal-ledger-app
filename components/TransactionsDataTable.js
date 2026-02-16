'use client';

import { useState, useMemo } from 'react';
import { formatCurrency, formatDate, parseLocalDate } from '@/lib/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, ArrowUpDown, MoreHorizontal, Download, Filter, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function TransactionsDataTable({ transactions, onEdit, onDelete, onMarkPaid, onBulkDelete, allTransactions }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState({ paid: true, unpaid: true });
  const [typeFilter, setTypeFilter] = useState({ income: true, expense: true, transfer: true });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedTransactions.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedTransactions.map(t => t.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    
    if (onBulkDelete) {
      await onBulkDelete(Array.from(selectedRows));
      setSelectedRows(new Set());
    }
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Institution', 'Amount', 'Type', 'Status'];
    const csvData = filteredAndSortedTransactions.map(t => [
      formatDate(t.date),
      t.company,
      t.amount,
      t.type,
      t.paid ? 'Paid' : 'Unpaid'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate running balance like a credit card statement
  // The balance shown is the balance AFTER that transaction was applied
  const transactionsWithBalance = useMemo(() => {
    // Use allTransactions if provided (for proper running balance across date filters)
    // Otherwise use the transactions prop (for backward compatibility)
    const txnsForBalance = allTransactions || transactions;
    
    // Sort ALL transactions chronologically (oldest to newest) for balance calculation
    const chronological = [...txnsForBalance].sort((a, b) => {
      const dateA = parseLocalDate(a.date);
      const dateB = parseLocalDate(b.date);
      return dateA - dateB;
    });

    // Calculate cumulative balance from oldest to newest
    let cumulativeBalance = 0;
    const balanceMap = new Map();
    
    chronological.forEach(t => {
      cumulativeBalance += t.amount;
      balanceMap.set(t.id, cumulativeBalance);
    });

    // Attach the balance to each transaction (only the visible ones)
    return transactions.map(t => ({
      ...t,
      runningBalance: balanceMap.get(t.id)
    }));
  }, [transactions, allTransactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    // Apply filters
    let filtered = transactionsWithBalance.filter(t => {
      // Search filter
      const matchesSearch = t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDate(t.date).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      // Status filter
      const matchesStatus = (statusFilter.paid && t.paid) || (statusFilter.unpaid && !t.paid);
      
      // Type filter
      const matchesType = 
        (typeFilter.income && t.type === 'Income') ||
        (typeFilter.expense && t.type === 'Expense') ||
        (typeFilter.transfer && t.type === 'Transfer');
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Apply user's sort preference for display
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        aVal = parseLocalDate(aVal);
        bVal = parseLocalDate(bVal);
      } else if (sortConfig.key === 'company') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactionsWithBalance, searchQuery, sortConfig, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, itemsPerPage]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No transactions yet. Add your first transaction to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {selectedRows.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {selectedRows.size} selected
          </Button>
        )}
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter.paid}
              onCheckedChange={(checked) => setStatusFilter(prev => ({ ...prev, paid: checked }))}
            >
              Paid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.unpaid}
              onCheckedChange={(checked) => setStatusFilter(prev => ({ ...prev, unpaid: checked }))}
            >
              Unpaid
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

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

        {/* Download CSV */}
        <Button variant="outline" size="sm" onClick={downloadCSV}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
              </TableHead>
              <TableHead className="text-left">
                <Button variant="ghost" size="sm" onClick={() => handleSort('date')} className="h-8 px-2 cursor-pointer">
                  Date
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-left">
                <Button variant="ghost" size="sm" onClick={() => handleSort('company')} className="h-8 px-2 cursor-pointer">
                  Institution
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-left">
                <Button variant="ghost" size="sm" onClick={() => handleSort('amount')} className="h-8 px-2 cursor-pointer">
                  Amount
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-left">Running Balance</TableHead>
              <TableHead className="text-left">Tags</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(transaction.id)}
                    onChange={() => toggleSelectRow(transaction.id)}
                    className="cursor-pointer"
                  />
                </TableCell>
                <TableCell className="font-medium text-left">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="text-left">{transaction.company}</TableCell>
                <TableCell className="font-medium text-left">
                  <span className={transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-left">
                  <span className={transaction.runningBalance >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(transaction.runningBalance)}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex gap-1 flex-wrap">
                    {transaction.paid && (
                      <Badge variant="secondary">
                        Paid
                      </Badge>
                    )}
                    {transaction.isAutoGenerated && (
                      <Badge variant="secondary">Auto</Badge>
                    )}
                    {transaction.isPending && (
                      <Badge variant="secondary">
                        Pending
                      </Badge>
                    )}
                    {transaction.tags && transaction.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!transaction.paid && (
                        <DropdownMenuItem onClick={() => onMarkPaid(transaction.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(transaction)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(transaction.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transaction(s)
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
    </div>
  );
}
