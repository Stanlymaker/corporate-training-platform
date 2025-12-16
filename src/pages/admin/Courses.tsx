import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { mockCourses } from '@/data/mockData';
import { getCategoryIcon, getCategoryGradient } from '@/utils/categoryIcons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminCourses() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredCourses = mockCourses.filter(course => {
    if (filter === 'published') return course.published;
    if (filter === 'draft') return !course.published;
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление курсами</h1>
            <p className="text-gray-600">Создавайте и редактируйте образовательный контент</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/courses/edit')}
          >
            <Icon name="Plus" className="mr-2" size={18} />
            Создать курс
          </Button>
        </div>

      <div className="flex gap-3 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Все ({mockCourses.length})
        </Button>
        <Button
          variant={filter === 'published' ? 'default' : 'outline'}
          onClick={() => setFilter('published')}
          size="sm"
        >
          Опубликованные ({mockCourses.filter(c => c.published).length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          onClick={() => setFilter('draft')}
          size="sm"
        >
          Черновики ({mockCourses.filter(c => !c.published).length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="transition-shadow hover:shadow-md overflow-hidden">
            <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200 relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(course.category)} opacity-10`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getCategoryGradient(course.category)} flex items-center justify-center shadow-lg`}>
                  <Icon name={getCategoryIcon(course.category) as any} size={40} className="text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-base text-gray-900 line-clamp-2 flex-1">{course.title}</h3>
                <div className="flex gap-1 shrink-0">
                  <Badge 
                    variant={course.accessType === 'open' ? 'outline' : 'default'} 
                    className={`text-xs ${course.accessType === 'closed' ? 'bg-purple-500' : ''}`}
                  >
                    <Icon name={course.accessType === 'open' ? 'Unlock' : 'Lock'} size={10} className="mr-1" />
                    {course.accessType === 'open' ? 'Откр.' : 'Закр.'}
                  </Badge>
                  <Badge variant={course.published ? 'default' : 'secondary'} className="text-xs">
                    {course.published ? 'Опубл.' : 'Черн.'}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Icon name="BookOpen" size={14} />
                  {course.lessonsCount} ур.
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Clock" size={14} />
                  {course.duration} мин
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Target" size={14} />
                  {course.passScore}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/courses/edit/${course.id}`)}
                >
                  <Icon name="Edit" className="mr-1" size={14} />
                  Редактировать
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/courses/view/${course.id}`)}
                >
                  <Icon name="Eye" className="mr-1" size={14} />
                  Просмотр
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}