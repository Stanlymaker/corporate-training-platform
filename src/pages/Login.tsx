import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const savedLogo = localStorage.getItem('platformLogo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const handleLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    setError('');
    
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (user.role === 'admin') {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(ROUTES.STUDENT.COURSES);
      }
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-[#e95122]">
              <Icon name="GraduationCap" className="text-white" size={32} />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Платформа обучения</h1>
          <p className="text-gray-600">Корпоративная система развития навыков</p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>Введите свои учетные данные для входа</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                    Вход...
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" className="mr-2" size={18} />
                    Войти
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}