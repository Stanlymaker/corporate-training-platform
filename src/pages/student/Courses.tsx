import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockProgress, mockAssignments } from '@/data/mockData';
import { getCategoryIcon, getCategoryGradient } from '@/utils/categoryIcons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function StudentCourses() {
  const [filter, setFilter] = useState<'all' | 'inProgress' | 'completed'>('all');
  const navigate = useNavigate();
  const userId = '2';

  const userProgress = mockProgress.filter(p => p.userId === userId);
  const progressMap = new Map(userProgress.map(p => [p.courseId, p]));
  
  const userAssignments = mockAssignments.filter(a => a.userId === userId);
  const assignedCourseIds = new Set(userAssignments.map(a => a.courseId));

  const availableCourses = mockCourses.filter(course => {
    return course.accessType === 'open' || assignedCourseIds.has(course.id);
  });

  const filteredCourses = availableCourses.filter(course => {
    const progress = progressMap.get(course.id);
    if (filter === 'inProgress') return progress && !progress.completed && progress.completedLessons > 0;
    if (filter === 'completed') return progress?.completed;
    return true;
  });

  return (
    <StudentLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои курсы</h1>
        <p className="text-gray-600">Продолжайте обучение или начните новый курс</p>
      </div>

      <div className="flex gap-3 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Все ({availableCourses.length})
        </Button>
        <Button
          variant={filter === 'inProgress' ? 'default' : 'outline'}
          onClick={() => setFilter('inProgress')}
          size="sm"
        >
          В процессе ({userProgress.filter(p => !p.completed && p.completedLessons > 0).length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          Завершены ({userProgress.filter(p => p.completed).length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const progress = progressMap.get(course.id);
            const progressPercent = progress
              ? (progress.completedLessons / progress.totalLessons) * 100
              : 0;
            const isAssigned = assignedCourseIds.has(course.id);

            return (
              <Card key={course.id} className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden group">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(course.category)} opacity-10`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getCategoryGradient(course.category)} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon name={getCategoryIcon(course.category) as any} size={48} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    {course.accessType === 'closed' && isAssigned && (
                      <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-purple-300 text-purple-700">
                        <Icon name="Lock" size={12} className="mr-1" />
                        Назначен
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
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
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2 text-xs">{course.category}</Badge>
                  <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Icon name="BookOpen" size={12} />
                      {course.lessonsCount} ур.
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={12} />
                      {course.duration} мин
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Target" size={12} />
                      {course.passScore}%
                    </span>
                  </div>

                  {progress && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600">Прогресс</span>
                        <span className="font-semibold text-gray-900">{Math.round(progressPercent)}%</span>
                      </div>
                      <Progress value={progressPercent} />
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    variant={progress?.completed ? 'outline' : 'default'}
                    onClick={() => navigate(`/student/courses/${course.id}`)}
                  >
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
    </StudentLayout>
  );
}