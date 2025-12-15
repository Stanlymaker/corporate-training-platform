import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { mockCourses, mockUsers, mockProgress } from '@/data/mockData';

export default function AdminDashboard() {
  const totalCourses = mockCourses.length;
  const publishedCourses = mockCourses.filter(c => c.published).length;
  const totalStudents = mockUsers.filter(u => u.role === 'student').length;
  const completedCourses = mockProgress.filter(p => p.completed).length;

  const stats = [
    {
      title: 'Всего курсов',
      value: totalCourses,
      icon: 'BookOpen',
      color: 'bg-orange-500',
      trend: `${publishedCourses} опубликовано`,
    },
    {
      title: 'Обучающихся',
      value: totalStudents,
      icon: 'Users',
      color: 'bg-amber-500',
      trend: 'Активных пользователей',
    },
    {
      title: 'Завершено курсов',
      value: completedCourses,
      icon: 'CheckCircle',
      color: 'bg-green-500',
      trend: 'Всего прохождений',
    },
    {
      title: 'Общая длительность',
      value: `${mockCourses.reduce((sum, c) => sum + c.duration, 0)} мин`,
      icon: 'Clock',
      color: 'bg-orange-500',
      trend: 'Учебного контента',
    },
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель управления</h1>
          <p className="text-gray-600">Добро пожаловать в систему управления обучением</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover-scale border-0 shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BookOpen" size={20} />
                Популярные курсы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <img src={course.image} alt={course.title} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{course.title}</h4>
                      <p className="text-sm text-gray-600">{course.lessonsCount} уроков • {course.duration} мин</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                      <Icon name="Users" size={14} />
                      <span>{Math.floor(Math.random() * 50) + 10}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" size={20} />
                Последняя активность
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsers.filter(u => u.role === 'student').map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">Последний вход: {user.lastActive}</p>
                    </div>
                    <Icon name="CheckCircle" className="text-green-500" size={20} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}