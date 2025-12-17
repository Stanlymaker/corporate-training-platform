import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    const success = login(email, password);
    
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
            <Icon name="GraduationCap" className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Платформа обучения</h1>
          <p className="text-gray-600">Корпоративная система развития навыков</p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>Введите свои учетные данные для входа</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" onClick={() => setEmail('student@company.com')}>
                  Обучающийся
                </TabsTrigger>
                <TabsTrigger value="admin" onClick={() => setEmail('admin@company.com')}>
                  Администратор
                </TabsTrigger>
              </TabsList>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="student" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="student@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-password">Пароль</Label>
                  <Input
                    id="student-password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <Button 
                  onClick={handleLogin} 
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Icon name="LogIn" className="mr-2" size={18} />
                  Войти как обучающийся
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Демо: student@company.com / password
                </p>
              </TabsContent>
              
              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Пароль</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <Button 
                  onClick={handleLogin} 
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Icon name="ShieldCheck" className="mr-2" size={18} />
                  Войти как администратор
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Демо: admin@company.com / password
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Демо-версия платформы корпоративного обучения</p>
        </div>
      </div>
    </div>
  );
}