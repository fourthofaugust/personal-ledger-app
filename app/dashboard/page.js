'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLedger } from '@/contexts/LedgerContext';
import { parseLocalDate } from '@/lib/transactions';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Dashboard() {
  const { transactions, savingsAccounts = [], isLoading } = useLedger();
  
  const [dateRange, setDateRange] = useState(() => {
    // Try to load saved date range from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-date-range');
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
    return {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    };
  });
  const [includeUnpaid, setIncludeUnpaid] = useState(true);
  const [includeSavings, setIncludeSavings] = useState(false);
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Save date range to localStorage whenever it changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      localStorage.setItem('dashboard-date-range', JSON.stringify({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      }));
    }
  }, [dateRange]);

  // Fetch balance from API when date range or includeUnpaid changes
  useEffect(() => {
    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const response = await fetch(
          `/api/analytics?endDate=${dateRange.to.toISOString()}&includeUnpaid=${includeUnpaid}`
        );
        const data = await response.json();
        setBalance(data.balance || 0);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(0);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
  }, [dateRange.to, includeUnpaid]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = parseLocalDate(t.date);
      return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    });
  }, [transactions, dateRange]);

  const analytics = useMemo(() => {
    // Balance is now fetched from API, just add savings if needed
    let totalBalance = balance;
    
    // Add savings if toggle is on
    if (includeSavings && savingsAccounts) {
      const savingsTotal = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      totalBalance += savingsTotal;
    }
    
    const income = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Count unpaid transactions that are due (date <= today)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const unpaidDue = filteredTransactions.filter(t => {
      const transactionDate = parseLocalDate(t.date);
      return !t.paid && transactionDate <= today;
    }).length;
    
    const avgTransaction = filteredTransactions.length > 0 ? balance / filteredTransactions.length : 0;
    
    // Calculate trends (compare with previous period)
    const periodLength = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24));
    const previousPeriodStart = subDays(dateRange.from, periodLength);
    const previousPeriodEnd = subDays(dateRange.to, periodLength);
    
    const previousTransactions = transactions.filter(t => {
      const transactionDate = parseLocalDate(t.date);
      return transactionDate >= previousPeriodStart && transactionDate <= previousPeriodEnd;
    });
    
    const previousIncome = previousTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const previousExpenses = previousTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const incomeTrend = previousIncome > 0 ? ((income - previousIncome) / previousIncome * 100).toFixed(1) : 0;
    const expensesTrend = previousExpenses > 0 ? ((expenses - previousExpenses) / previousExpenses * 100).toFixed(1) : 0;
    
    return {
      balance: totalBalance,
      income,
      expenses,
      unpaidDue,
      avgTransaction,
      incomeTrend,
      expensesTrend,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, transactions, dateRange, includeSavings, savingsAccounts, balance]);

  const chartData = useMemo(() => {
    const monthlyData = {};
    
    filteredTransactions.forEach(t => {
      const date = format(parseLocalDate(t.date), 'MMM yyyy');
      if (!monthlyData[date]) {
        monthlyData[date] = { date, income: 0, expenses: 0 };
      }
      if (t.amount > 0) {
        monthlyData[date].income += t.amount;
      } else {
        monthlyData[date].expenses += Math.abs(t.amount);
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
  }, [filteredTransactions]);

  const setDateRangePreset = (preset) => {
    const now = new Date();
    switch (preset) {
      case 'today':
        setDateRange({ from: now, to: now });
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case 'last7':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case 'last28':
        setDateRange({ from: subDays(now, 28), to: now });
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'thisYear':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground hidden md:block">Financial overview and analytics</p>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM yyyy')}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex">
                  <div className="border-r p-3 space-y-1 min-w-[140px]">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={() => setDateRangePreset('today')}>
                      Today
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={() => setDateRangePreset('yesterday')}>
                      Yesterday
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={() => setDateRangePreset('last7')}>
                      Last 7 Days
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={() => setDateRangePreset('last28')}>
                      Last 28 Days
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={() => setDateRangePreset('thisMonth')}>
                      This Month
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={() => setDateRangePreset('lastMonth')}>
                      Last Month
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={() => setDateRangePreset('thisYear')}>
                      This Year
                    </Button>
                  </div>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    className="p-3"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

        {/* Row 1: Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-unpaid"
                    checked={includeUnpaid}
                    onCheckedChange={setIncludeUnpaid}
                  />
                  <Label htmlFor="include-unpaid" className="text-xs cursor-pointer whitespace-nowrap">
                    Unpaid
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-savings"
                    checked={includeSavings}
                    onCheckedChange={setIncludeSavings}
                  />
                  <Label htmlFor="include-savings" className="text-xs cursor-pointer whitespace-nowrap">
                    Savings
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold break-words">
                ${analytics.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${analytics.income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${analytics.expenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid & Due</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.unpaidDue === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[80px]">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground text-center">All caught up!</p>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {analytics.unpaidDue}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const endOfToday = new Date(today);
                      endOfToday.setHours(23, 59, 59, 999);
                      
                      const dueToday = filteredTransactions.filter(t => {
                        const transactionDate = parseLocalDate(t.date);
                        transactionDate.setHours(0, 0, 0, 0);
                        return !t.paid && transactionDate.getTime() === today.getTime();
                      }).length;
                      
                      const pastDue = filteredTransactions.filter(t => {
                        const transactionDate = parseLocalDate(t.date);
                        return !t.paid && transactionDate < today;
                      }).length;
                      
                      const parts = [];
                      if (dueToday > 0) {
                        parts.push(`${dueToday} ${dueToday === 1 ? 'payment' : 'payments'} due today`);
                      }
                      if (pastDue > 0) {
                        parts.push(`${pastDue} past due`);
                      }
                      
                      return parts.join('. ') + '.';
                    })()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Donut Chart + Spend by Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>Financial breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Income', value: analytics.income, fill: '#e5e5e5' },
                      { name: 'Expenses', value: analytics.expenses, fill: '#737373' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium mb-1">{payload[0].name}</p>
                            <p className="text-sm">${payload[0].value.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e5e5e5' }}></div>
                  <span className="text-sm">Income: ${analytics.income.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#737373' }}></div>
                  <span className="text-sm">Expenses: ${analytics.expenses.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spend by Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Spend by Categories</CardTitle>
              <CardDescription>Expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  // Group transactions by company (category)
                  const categoryData = {};
                  const expenseTransactions = filteredTransactions.filter(t => t.amount < 0);
                  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                  
                  expenseTransactions.forEach(t => {
                    const category = t.company;
                    if (!categoryData[category]) {
                      categoryData[category] = 0;
                    }
                    categoryData[category] += Math.abs(t.amount);
                  });
                  
                  // Convert to array and sort by amount
                  const categories = Object.entries(categoryData)
                    .map(([name, amount]) => ({
                      name,
                      amount,
                      percentage: totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(0) : 0
                    }))
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 6);
                  
                  return categories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm font-bold">{category.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
