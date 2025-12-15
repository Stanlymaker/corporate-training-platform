import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockProgress } from '@/data/mockData';
import { useState } from 'react';

export default function StudentCourses() {
  const [filter, setFilter] = useState<'all' | 'inProgress' | 'completed'>('all');
  const userId = '2';

  const userProgress = mockProgress.filter(p => p.userId === userId);
  const progressMap = new Map(userProgress.map(p => [p.courseId, p]));

  const filteredCourses = mockCourses.filter(course => {
    const progress = progressMap.get(course.id);
    if (filter === 'inProgress') return progress && !progress.completed && progress.completedLessons > 0;
    if (filter === 'completed') return progress?.completed;
    return true;
  });

  return (
    <StudentLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои курсы</h1>
          <p className="text-gray-600">Продолжайте обучение или начните новый курс</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Все курсы ({mockCourses.length})
          </Button>
          <Button
            variant={filter === 'inProgress' ? 'default' : 'outline'}
            onClick={() => setFilter('inProgress')}
          >
            В процессе ({userProgress.filter(p => !p.completed && p.completedLessons > 0).length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Завершены ({userProgress.filter(p => p.completed).length})
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const progress = progressMap.get(course.id);
            const progressPercent = progress
              ? (progress.completedLessons / progress.totalLessons) * 100
              : 0;

            return (
              <Card key={course.id} className="border-0 shadow-md hover:shadow-xl transition-all overflow-hidden group">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    {progress?.completed ? (
                      <Badge className="bg-green-500">
                        <Icon name="CheckCircle" size={14} className="mr-1" />
                        Завершен
                      </Badge>
                    ) : progress && progress.completedLessons > 0 ? (
                      <Badge className="bg-orange-500">
                        <Icon name="Clock" size={14} className="mr-1" />
                        В процессе
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Новый</Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-3">{course.category}</Badge>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
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

                  {progress && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Прогресс</span>
                        <span className="font-semibold text-gray-900">{Math.round(progressPercent)}%</span>
                      </div>
                      <Progress value={progressPercent} />
                    </div>
                  )}

                  <Button className="w-full" variant={progress?.completed ? 'outline' : 'default'}>
                    {progress?.completed ? (
                      <>
                        <Icon name="RotateCcw" className="mr-2" size={16} />
                        Пройти повторно
                      </>
                    ) : progress && progress.completedLessons > 0 ? (
                      <>
                        <Icon name="Play" className="mr-2" size={16} />
                        Продолжить обучение
                      </>
                    ) : (
                      <>
                        <Icon name="PlayCircle" className="mr-2" size={16} />
                        Начать курс
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </StudentLayout>
  );
}
