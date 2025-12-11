// frontend/src/components/LoginPage.tsx

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AlertCircle } from 'lucide-react';

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onNavigateToRegister: () => void;
};

export function LoginPage({ onLogin, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (email && password) {
      const errorMsg = await onLogin(email, password);
      if (errorMsg) {
        setError(errorMsg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-neutral-900" />
          </div>
          <CardTitle className="text-center">AllergyCheck</CardTitle>
          <CardDescription className="text-center">
            Войдите в свой аккаунт для анализа этикеток
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div
                style={{
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  borderColor: '#fecaca',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Войти
            </Button>
            <div className="text-center text-sm text-neutral-600">
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-neutral-900 hover:underline"
              >
                Зарегистрироваться
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}