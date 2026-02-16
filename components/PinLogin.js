'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InputOTP } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle } from 'lucide-react';

export default function PinLogin() {
  const { login, resetPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinComplete = async (completedPin) => {
    setError('');
    setIsLoading(true);
    
    const result = await login(completedPin);
    
    if (!result.success) {
      setError(result.error || 'Invalid PIN');
      setPin('');
    }
    
    setIsLoading(false);
  };

  const handleForgotPin = async () => {
    try {
      const response = await fetch('/api/auth/reset');
      const data = await response.json();
      
      if (response.ok) {
        setSecurityQuestion(data.securityQuestion);
        setIsResetting(true);
        setError('');
      } else {
        setError(data.error || 'Failed to load security question');
      }
    } catch (error) {
      setError('Failed to load security question');
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      setError('PIN must be 6 digits');
      setIsLoading(false);
      return;
    }

    const result = await resetPin(newPin, securityAnswer);
    
    if (!result.success) {
      setError(result.error || 'Failed to reset PIN');
    }
    
    setIsLoading(false);
  };

  const handleCancelReset = () => {
    setIsResetting(false);
    setSecurityQuestion('');
    setSecurityAnswer('');
    setNewPin('');
    setError('');
  };

  if (isResetting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <h1 className="text-4xl font-bold mb-2">Personal Ledger</h1>
              <p className="text-sm text-muted-foreground">Your personal finance tracker</p>
            </div>
            <div className="mx-auto my-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Reset PIN</CardTitle>
            <CardDescription>Answer your security question to reset your PIN</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPin} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">{securityQuestion}</Label>
                <Input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your answer"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN (6 digits)</Label>
                <Input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new PIN"
                  autoComplete="off"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCancelReset} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Resetting...' : 'Reset PIN'}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t pt-4">
            <p className="text-xs text-muted-foreground">Personal Ledger © {new Date().getFullYear()}</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <h1 className="text-4xl font-bold mb-2">Personal Ledger</h1>
            <p className="text-sm text-muted-foreground">Your personal finance tracker</p>
          </div>
          <div className="mx-auto my-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Enter PIN</CardTitle>
          <CardDescription>Enter your 6-digit PIN to access the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              length={6}
              value={pin}
              onChange={setPin}
              onComplete={handlePinComplete}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-center">
            <Button
              variant="link"
              onClick={handleForgotPin}
              className="text-sm text-muted-foreground hover:text-primary cursor-pointer"
            >
              Forgot PIN?
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-xs text-muted-foreground">Personal Ledger © {new Date().getFullYear()}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
