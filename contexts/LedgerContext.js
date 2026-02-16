'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LedgerContext = createContext();

export function LedgerProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [recurringTemplates, setRecurringTemplates] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/transactions');
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecurringTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recurring-templates');
      const result = await response.json();
      
      if (result.success) {
        setRecurringTemplates(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavingsAccounts = async () => {
    try {
      const response = await fetch('/api/savings-accounts');
      const result = await response.json();
      
      if (result.success) {
        setSavingsAccounts(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const addTransaction = async (transaction) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchTransactions();
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (id, updates) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchTransactions();
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchTransactions();
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addRecurringTemplate = async (template) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recurring-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchRecurringTemplates();
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecurringTemplate = async (id, updates) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/recurring-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchRecurringTemplates();
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecurringTemplate = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/recurring-templates/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchRecurringTemplates();
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const pauseRecurringTemplate = async (id) => {
    await updateRecurringTemplate(id, { isActive: false });
  };

  const resumeRecurringTemplate = async (id) => {
    await updateRecurringTemplate(id, { isActive: true });
  };

  const processRecurringTransactions = async () => {
    // Prevent concurrent processing
    if (isProcessing) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setIsLoading(true);
      const response = await fetch('/api/recurring-templates/process', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchTransactions();
        await fetchRecurringTemplates();
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const addSavingsAccount = async (account) => {
    try {
      const response = await fetch('/api/savings-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSavingsAccounts();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateSavingsAccount = async (id, updates) => {
    try {
      const response = await fetch(`/api/savings-accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSavingsAccounts();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSavingsAccount = async (id) => {
    try {
      const response = await fetch(`/api/savings-accounts/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSavingsAccounts();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchRecurringTemplates();
    fetchSavingsAccounts();
  }, []);

  const value = {
    transactions,
    recurringTemplates,
    savingsAccounts,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addRecurringTemplate,
    updateRecurringTemplate,
    deleteRecurringTemplate,
    pauseRecurringTemplate,
    resumeRecurringTemplate,
    processRecurringTransactions,
    fetchTransactions,
    fetchRecurringTemplates,
    fetchSavingsAccounts,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount
  };

  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
}
