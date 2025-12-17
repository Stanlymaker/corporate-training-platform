import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [usersRes, coursesRes] = await Promise.all([
        fetch(API_ENDPOINTS.USERS, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok && coursesRes.ok) {
        const usersData = await usersRes.json();
        const coursesData = await coursesRes.json();

        const users = usersData.users || [];
        const courses = coursesData.courses || [];

        setStats({
          totalCourses: courses.length,
          publishedCourses: courses.filter((c: any) => c.published).length,
          totalStudents: users.filter((u: any) => u.role === 'student').length,
          activeUsers: users.filter((u: any) => u.isActive).length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Всего курсов',
      value: stats.totalCourses,
      icon: 'BookOpen',
      color: 'bg-orange-500',
      trend: `${stats.publishedCourses} опубликовано`,
    },
    {
      title: 'Обучающихся',
      value: stats.totalStudents,
      icon: 'Users',
      color: 'bg-amber-500',
      trend: `${stats.activeUsers} активных`,
    },
    {
      title: 'Активных пользователей',
      value: stats.activeUsers,
      icon: 'CheckCircle',
      color: 'bg-green-500',
      trend: 'Всего пользователей',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель управления</h1>
          <p className="text-gray-600">Добро пожаловать в систему управления обучением</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <Icon name={stat.icon as any} className="text-white" size={24} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 mb-1">{stat.title}</div>
                <div className="text-xs text-gray-500">{stat.trend}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" size={20} />
                Статистика платформы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Icon name="BookOpen" size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Курсы</p>
                      <p className="text-sm text-gray-600">{stats.publishedCourses} из {stats.totalCourses} опубликованы</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCourses}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="Users" size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Студенты</p>
                      <p className="text-sm text-gray-600">{stats.activeUsers} активных пользователей</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon name="Award" size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Система готова</p>
                      <p className="text-sm text-gray-600">Начните создавать курсы и назначать студентам</p>
                    </div>
                  </div>
                  <Icon name="CheckCircle" size={32} className="text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
