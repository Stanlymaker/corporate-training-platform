import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { mockCourses, mockLessons, mockProgress } from '@/data/mockData';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const userId = '2';

  const course = mockCourses.find(c => c.id === courseId);
  const lessons = mockLessons.filter(l => l.courseId === courseId).sort((a, b) => a.order - b.order);
  const progress = mockProgress.find(p => p.courseId === courseId && p.userId === userId);

  if (!course) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
          <Button onClick={() => navigate(ROUTES.STUDENT.COURSES)}>
            Вернуться к курсам
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const progressPercent = progress ? (progress.completedLessons / progress.totalLessons) * 100 : 0;

  const handleLessonClick = (lessonId: string, lessonIndex: number) => {
    const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
    const isLocked = previousLesson?.requiresPrevious && !progress?.completedLessonIds.includes(previousLesson.id);
    
    if (!isLocked) {
      navigate(ROUTES.STUDENT.LESSON.replace(':courseId', courseId!).replace(':lessonId', lessonId));
    }
  };

  return (
    <StudentLayout>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(ROUTES.STUDENT.COURSES)}
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад к курсам
        </Button>
        
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/10 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                {progress?.completed && (
                  <Badge className="bg-green-500">
                    <Icon name="CheckCircle" size={14} className="mr-1" />
                    Завершен
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4 text-lg">{course.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={16} />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={16} />
                  <span>{course.duration} мин</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="BookOpen" size={16} />
                  <span>{lessons.length} уроков</span>
                </div>
              </div>
            </div>
            <img 
              src={course.image} 
              alt={course.title}
              className="w-48 h-32 object-cover rounded-xl shadow-lg"
            />
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Прогресс прохождения</span>
              <span className="text-sm font-bold text-gray-900">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-gray-500 mt-2">
              Завершено {progress?.completedLessons || 0} из {progress?.totalLessons || lessons.length} уроков
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="List" size={20} />
              Программа курса
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const isCompleted = progress?.completedLessonIds.includes(lesson.id);
                const previousLesson = index > 0 ? lessons[index - 1] : null;
                const isLocked = lesson.requiresPrevious && previousLesson && !progress?.completedLessonIds.includes(previousLesson.id);
                const isLastAccessed = progress?.lastAccessedLesson === lesson.id;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson.id, index)}
                    disabled={isLocked}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isLastAccessed
                        ? 'border-primary bg-primary/5'
                        : isLocked
                        ? 'border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isLocked
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {isLocked ? (
                          <Icon name="Lock" size={18} />
                        ) : isCompleted ? (
                          <Icon name="Check" size={18} />
                        ) : (
                          <span className="font-bold text-sm">{lesson.order}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon 
                            name={
                              lesson.type === 'video' ? 'Video' :
                              lesson.type === 'text' ? 'FileText' :
                              lesson.type === 'quiz' ? 'ClipboardList' :
                              'Circle'
                            }
                            size={16} 
                            className="text-gray-400" 
                          />
                          <span className="font-semibold text-gray-900">
                            {lesson.title}
                          </span>
                          {isLastAccessed && !isCompleted && (
                            <Badge variant="outline" className="ml-2">В процессе</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{lesson.description}</p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Icon name="Clock" size={12} />
                            {lesson.duration} мин
                          </div>
                        </div>
                        <Icon 
                          name="ChevronRight" 
                          size={20} 
                          className={isLocked ? 'text-gray-300' : 'text-gray-400'} 
                        />
                      </div>
                    </div>

                    {isLocked && previousLesson && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          <Icon name="Info" size={12} className="inline mr-1" />
                          Завершите урок "{previousLesson.title}" для доступа
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {progress && progress.completedLessons > 0 && (
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Icon name="Award" size={20} />
                Ваши достижения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{progress.completedLessons}</div>
                  <div className="text-sm text-green-700">Уроков завершено</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{Math.round(progressPercent)}%</div>
                  <div className="text-sm text-green-700">Прогресс</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{progress.earnedRewards.length}</div>
                  <div className="text-sm text-green-700">Наград получено</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
