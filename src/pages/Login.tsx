import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleLogin = (role: 'admin' | 'student') => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email || (role === 'admin' ? 'admin@company.com' : 'student@company.com'));
    
    if (role === 'admin') {
      navigate(ROUTES.ADMIN.DASHBOARD);
    } else {
      navigate(ROUTES.STUDENT.DASHBOARD);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <Icon name="GraduationCap" className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Платформа обучения</h1>
          <p className="text-gray-600">Корпоративная система развития навыков</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>Выберите роль для демонстрации функционала</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student">Обучающийся</TabsTrigger>
                <TabsTrigger value="admin">Администратор</TabsTrigger>
              </TabsList>
              
              <TabsContent value="student" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="student@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => handleLogin('student')} 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  size="lg"
                >
                  <Icon name="LogIn" className="mr-2" size={18} />
                  Войти как обучающийся
                </Button>
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
                  />
                </div>
                <Button 
                  onClick={() => handleLogin('admin')} 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  size="lg"
                >
                  <Icon name="ShieldCheck" className="mr-2" size={18} />
                  Войти как администратор
                </Button>
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