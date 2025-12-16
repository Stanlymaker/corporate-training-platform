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
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
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
          >
            Все курсы ({mockCourses.length})
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            onClick={() => setFilter('published')}
          >
            Опубликованные ({mockCourses.filter(c => c.published).length})
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            onClick={() => setFilter('draft')}
          >
            Черновики ({mockCourses.filter(c => !c.published).length})
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-32 h-32 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{course.title}</h3>
                      <Badge variant={course.published ? 'default' : 'secondary'}>
                        {course.published ? 'Опубликован' : 'Черновик'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Icon name="BookOpen" size={14} />
                        {course.lessonsCount} уроков
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        {course.duration} мин
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Target" size={14} />
                        {course.passScore}% проходной балл
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/admin/courses/edit/${course.id}`)}
                  >
                    <Icon name="Edit" className="mr-2" size={16} />
                    Редактировать
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/admin/courses/view/${course.id}`)}
                  >
                    <Icon name="Eye" className="mr-2" size={16} />
                    Просмотр
                  </Button>
                  <Button variant="outline" size="icon">
                    <Icon name="MoreVertical" size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}