import React, { useState } from 'react';
import { account } from '../lib/appwrite';
import { OAuthProvider } from 'appwrite';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './ui/card';

const AuthForm: React.FC<{ onLoginSuccess: (user: any) => void }> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const successUrl = window.location.origin + '/';
      const failureUrl = window.location.origin + '/';
      await account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);
    } catch (err: any) {
      setError(err.message || 'Error con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Lipoout WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cargando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleGoogleAuth} disabled={loading}>
            Entrar con Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthForm;
