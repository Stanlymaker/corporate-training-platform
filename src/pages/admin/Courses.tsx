import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { mockCourses } from '@/data/mockData';
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
            <div className="aspect-video w-full">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-base text-gray-900 line-clamp-2 flex-1">{course.title}</h3>
                <Badge variant={course.published ? 'default' : 'secondary'} className="shrink-0 text-xs">
                  {course.published ? 'Опубл.' : 'Черн.'}
                </Badge>
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