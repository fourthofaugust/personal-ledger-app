'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Session timeout: 30 minutes of inactivity
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const LAST_ACTIVITY_KEY = 'lastActivity';
  const SESSION_KEY = 'isAuthenticated';

  useEffect(() => {
    checkPinStatus();
    checkSession();
    
    // Set up activity listeners
    const updateActivity = () => {
      if (isAuthenticated) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    };

    // Track user activity
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Check for inactivity every minute
    const inactivityCheck = setInterval(() => {
      checkInactivity();
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(inactivityCheck);
    };
  }, [isAuthenticated]);

  const checkSession = () => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    
    if (savedSession === 'true' && lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      
      if (timeSinceActivity < SESSION_TIMEOUT) {
        setIsAuthenticated(true);
      } else {
        // Session expired
        clearSession();
      }
    }
  };

  const checkInactivity = () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    
    if (lastActivity && isAuthenticated) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        // Auto logout due to inactivity
        logout();
      }
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setIsAuthenticated(false);
  };

  const checkPinStatus = async () => {
    try {
      const response = await fetch('/api/auth/setup');
      const data = await response.json();
      setIsPinSet(data.pinSet);
      
      // If no PIN is set, user is automatically authenticated
      if (!data.pinSet) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to check PIN status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (pin) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to verify PIN' };
    }
  };

  const logout = () => {
    clearSession();
  };

  const setupPin = async (pin, securityQuestion, securityAnswer) => {
    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, securityQuestion, securityAnswer })
      });

      if (response.ok) {
        setIsPinSet(true);
        setIsAuthenticated(true);
        localStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Setup PIN error:', error);
      return { success: false, error: 'Failed to setup PIN' };
    }
  };

  const resetPin = async (newPin, securityAnswer) => {
    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin, securityAnswer })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Reset PIN error:', error);
      return { success: false, error: 'Failed to reset PIN' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isPinSet,
        isLoading,
        login,
        logout,
        setupPin,
        resetPin,
        checkPinStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
