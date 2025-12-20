import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Badge } from '@/components/ui/badge';

interface CourseProgressMatrixProps {
  show: boolean;
  courseId: number;
  courseTitle: string;
  onClose: () => void;
}

interface Student {
  id: number;
  name: string;
  email: string;
}

interface Lesson {
  id: number;
  title: string;
  type: string;
  order: number;
}

interface Progress {
  userId: number;
  courseId: number;
  completedLessonIds: string[];
}

interface TestResult {
  userId: number;
  lessonId: string;
  score: number;
  passed: boolean;
}

export default function CourseProgressMatrix({
  show,
  courseId,
  courseTitle,
  onClose,
}: CourseProgressMatrixProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<number, Progress>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show, courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем уроки курса
      const lessonsRes = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseId}`, {
        headers: getAuthHeaders(),
      });
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons((lessonsData.lessons || []).sort((a: Lesson, b: Lesson) => a.order - b.order));
      }

      // Загружаем студентов
      const usersRes = await fetch(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        
        // Загружаем прогресс по курсу для всех студентов
        const allStudents = (usersData.users || [])
          .filter((u: any) => u.role === 'student' && u.isActive);
        
        // Фильтруем только тех студентов, у кого есть прогресс по этому курсу
        const studentsWithProgress: Student[] = [];
        
        for (const student of allStudents) {
          try {
            const progressRes = await fetch(
              `${API_ENDPOINTS.PROGRESS}?userId=${student.id}&courseId=${courseId}`,
              { headers: getAuthHeaders() }
            );

            if (progressRes.ok) {
              const data = await progressRes.json();
              if (data.progress?.[0]) {
                studentsWithProgress.push(student);
              }
            }
          } catch (error) {
            console.error('Error checking progress:', error);
          }
        }
        
        const sortedStudents = studentsWithProgress.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setStudents(sortedStudents);

        // Загружаем прогресс для каждого студента
        const progressMap: Record<number, Progress> = {};
        const testResultsMap: Record<string, TestResult> = {};

        for (const student of sortedStudents) {
            try {
              const progressRes = await fetch(
                `${API_ENDPOINTS.PROGRESS}?userId=${student.id}&courseId=${courseId}`,
                { headers: getAuthHeaders() }
              );

              if (progressRes.ok) {
                const data = await progressRes.json();
                if (data.progress?.[0]) {
                  progressMap[student.id] = data.progress[0];
                }
              }

              // Загружаем результаты тестов для каждого урока
              const lessonsList = lessonsData.lessons || [];
              for (const lesson of lessonsList) {
                if (lesson.type === 'test' && lesson.testId) {
                  try {
                    const testRes = await fetch(
                      `${API_ENDPOINTS.TESTS}?action=results&lessonId=${lesson.id}`,
                      {
                        headers: {
                          ...getAuthHeaders(),
                          'X-User-Id-Override': String(student.id),
                        },
                      }
                    );

                    if (testRes.ok) {
                      const testData = await testRes.json();
                      if (testData.result) {
                        const key = `${student.id}-${lesson.id}`;
                        testResultsMap[key] = {
                          userId: student.id,
                          lessonId: String(lesson.id),
                          score: testData.result.score,
                          passed: testData.result.passed,
                        };
                      }
                    }
                  } catch (err) {
                    console.error('Error loading test result:', err);
                  }
                }
              }
            } catch (error) {
              console.error('Error loading progress:', error);
            }
          }

        setProgress(progressMap);
        setTestResults(testResultsMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLessonStatus = (studentId: number, lessonId: number) => {
    const studentProgress = progress[studentId];
    if (!studentProgress) {
      return { status: 'not_started', label: 'Не начат', color: 'bg-gray-100 text-gray-600' };
    }

    const isCompleted = studentProgress.completedLessonIds?.includes(String(lessonId));
    
    if (isCompleted) {
      return { status: 'completed', label: 'Пройден', color: 'bg-green-100 text-green-700' };
    }

    return { status: 'not_started', label: 'Не начат', color: 'bg-gray-100 text-gray-600' };
  };

  const getTestResult = (studentId: number, lessonId: number) => {
    const key = `${studentId}-${lessonId}`;
    return testResults[key];
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="BarChart3" size={20} />
            Матрица прогресса — {courseTitle}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            {students.length} студентов × {lessons.length} уроков
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Нет студентов на этом курсе</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="border border-gray-300 bg-gray-50 p-3 text-left font-semibold text-sm min-w-[200px] sticky left-0 z-20">
                    Студент
                  </th>
                  {lessons.map((lesson) => (
                    <th
                      key={lesson.id}
                      className="border border-gray-300 bg-gray-50 p-3 text-center font-semibold text-xs min-w-[120px] max-w-[150px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon
                          name={lesson.type === 'test' ? 'FileText' : lesson.type === 'video' ? 'Video' : 'BookOpen'}
                          size={16}
                          className="text-gray-600"
                        />
                        <span className="line-clamp-2">{lesson.title}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 sticky left-0 bg-white z-10">
                      <div>
                        <div className="font-medium text-sm">{student.name}</div>
                        <div className="text-xs text-gray-500 truncate">{student.email}</div>
                      </div>
                    </td>
                    {lessons.map((lesson) => {
                      const status = getLessonStatus(student.id, lesson.id);
                      const testResult = lesson.type === 'test' ? getTestResult(student.id, lesson.id) : null;

                      return (
                        <td key={lesson.id} className="border border-gray-300 p-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {status.status === 'completed' ? (
                              <Icon name="CheckCircle" size={20} className="text-green-600" />
                            ) : (
                              <Icon name="Circle" size={20} className="text-gray-300" />
                            )}
                            {testResult && (
                              <Badge
                                className={`text-xs ${
                                  testResult.passed
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {testResult.score}%
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{status.label}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Icon name="CheckCircle" size={16} className="text-green-600" />
              <span>Пройден</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="Circle" size={16} className="text-gray-300" />
              <span>Не начат</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-green-100 text-green-700 text-xs">%</Badge>
              <span>Результат теста</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}