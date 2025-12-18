import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, CourseAssignment, Course, Lesson, CourseProgress, TestResult } from '@/types';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface UserCoursesManagementProps {
  user: User;
  assignments: CourseAssignment[];
  onAssignCourse?: (userId: string, courseId: string) => void;
  onRemoveAssignment?: (assignmentId: string) => void;
}

export default function UserCoursesManagement({ 
  user, 
  assignments, 
  onAssignCourse, 
  onRemoveAssignment 
}: UserCoursesManagementProps) {
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsData, setLessonsData] = useState<Record<string, Lesson[]>>({});
  const [progressData, setProgressData] = useState<CourseProgress[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResult[]>>({});

  useEffect(() => {
    loadCourses();
    loadProgress();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRESS}?userId=${user.id}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setProgressData(data.progress || []);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadCourseLessons = async (courseId: string) => {
    if (lessonsData[courseId]) return;
    
    try {
      // Находим курс по UUID, чтобы получить display_id
      const course = courses.find(c => c.id === courseId);
      const displayId = course?.displayId || courseId;
      
      const response = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${displayId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setLessonsData(prev => ({ ...prev, [courseId]: data.lessons || [] }));
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadTestResults = async (courseId: string) => {
    if (testResults[courseId]) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.TESTS}?action=results&courseId=${courseId}&userId=${user.id}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({ ...prev, [courseId]: data.results || [] }));
      }
    } catch (error) {
      console.error('Error loading test results:', error);
    }
  };

  const toggleCourse = async (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
    } else {
      setExpandedCourseId(courseId);
      await loadCourseLessons(courseId);
      await loadTestResults(courseId);
    }
  };

  const userAssignments = assignments;
  const assignedCourseIds = userAssignments.map(a => a.courseId);
  const completedCourseIds = userAssignments.filter(a => a.status === 'completed').map(a => a.courseId);

  const getCourseStatus = (course: Course) => {
    const isCompleted = completedCourseIds.includes(course.id);
    const assignment = userAssignments.find(a => a.courseId === course.id);
    
    if (isCompleted) {
      return { status: 'completed', label: 'Пройден', color: 'bg-green-500 text-white' };
    }
    
    if (assignment) {
      switch (assignment.status) {
        case 'assigned':
          return { status: 'assigned', label: 'Назначен', color: 'bg-blue-50 text-blue-700 border border-blue-200' };
        case 'in_progress':
          return { status: 'in_progress', label: 'В процессе', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' };
        case 'overdue':
          return { status: 'overdue', label: 'Просрочен', color: 'bg-red-50 text-red-700 border border-red-200' };
        default:
          return { status: 'assigned', label: 'Назначен', color: 'bg-blue-50 text-blue-700 border border-blue-200' };
      }
    }
    
    if (course.accessType === 'open') {
      return { status: 'available', label: 'Доступен', color: 'bg-gray-100 text-gray-700 border border-gray-200' };
    }
    
    return { status: 'not_assigned', label: 'Не назначен', color: 'bg-gray-50 text-gray-500 border border-gray-200' };
  };

  if (user.role !== 'student') return null;

  if (loading) {
    return (
      <div className="border-t pt-6">
        <div className="flex justify-center py-4">
          <Icon name="Loader2" className="animate-spin" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-6">
      <h5 className="font-bold mb-4 flex items-center gap-2">
        <Icon name="BookOpen" size={18} />
        Все курсы и доступ
      </h5>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Unlock" size={16} className="text-green-500" />
            <h6 className="font-semibold text-gray-700">Открытые курсы</h6>
          </div>
          <div className="space-y-2">
            {courses.filter(c => c.accessType === 'open').map((course) => {
              const courseStatus = getCourseStatus(course);
              
              const isExpanded = expandedCourseId === course.id;
              const lessons = lessonsData[course.id] || [];
              const progress = progressData.find(p => p.courseId === course.id);
              const courseTestResults = testResults[course.id] || [];
              
              return (
                <div key={course.id} className="bg-gray-50 rounded-lg">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={18} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {course.lessonsCount} уроков • {course.duration} мин
                        </div>
                      </div>
                    </div>
                    <Badge className={courseStatus.color}>
                      {courseStatus.label}
                    </Badge>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {lessons.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">Загрузка уроков...</div>
                      ) : (
                        lessons.map((lesson) => {
                          const isCompleted = progress?.completedLessonIds?.includes(lesson.id) || false;
                          const testResult = courseTestResults.find(tr => tr.testId === lesson.testId);
                          
                          return (
                            <div key={lesson.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                }`}>
                                  {isCompleted ? (
                                    <Icon name="Check" size={14} className="text-white" />
                                  ) : (
                                    <span className="text-xs text-gray-500">{lesson.order + 1}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                                  <div className="text-xs text-gray-500">{lesson.duration} мин</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.type === 'test' && testResult && (
                                  <Badge className={testResult.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                    {testResult.score}%
                                  </Badge>
                                )}
                                {isCompleted ? (
                                  <Badge className="bg-green-100 text-green-700">Пройден</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-600">Не начат</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Lock" size={16} className="text-orange-500" />
            <h6 className="font-semibold text-gray-700">Закрытые курсы</h6>
          </div>
          <div className="space-y-2">
            {courses.filter(c => c.accessType === 'closed').map((course) => {
              const courseStatus = getCourseStatus(course);
              const assignment = userAssignments.find(a => a.courseId === course.id);
              const isAssigned = assignedCourseIds.includes(course.id);
              
              const isExpanded = expandedCourseId === course.id;
              const lessons = lessonsData[course.id] || [];
              const progress = progressData.find(p => p.courseId === course.id);
              const courseTestResults = testResults[course.id] || [];
              
              return (
                <div key={course.id} className="bg-gray-50 rounded-lg">
                  <div className="p-4 flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={18} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {course.lessonsCount} уроков • {course.duration} мин
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={courseStatus.color}>
                        {courseStatus.label}
                      </Badge>
                      {!isAssigned && onAssignCourse && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); onAssignCourse(user.id, course.id); }}
                        >
                          <Icon name="Plus" size={14} className="mr-1" />
                          Назначить
                        </Button>
                      )}
                      {isAssigned && onRemoveAssignment && assignment && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); onRemoveAssignment(assignment.id); }}
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {lessons.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">Загрузка уроков...</div>
                      ) : (
                        lessons.map((lesson) => {
                          const isCompleted = progress?.completedLessonIds?.includes(lesson.id) || false;
                          const testResult = courseTestResults.find(tr => tr.testId === lesson.testId);
                          
                          return (
                            <div key={lesson.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                }`}>
                                  {isCompleted ? (
                                    <Icon name="Check" size={14} className="text-white" />
                                  ) : (
                                    <span className="text-xs text-gray-500">{lesson.order + 1}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                                  <div className="text-xs text-gray-500">{lesson.duration} мин</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.type === 'test' && testResult && (
                                  <Badge className={testResult.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                    {testResult.score}%
                                  </Badge>
                                )}
                                {isCompleted ? (
                                  <Badge className="bg-green-100 text-green-700">Пройден</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-600">Не начат</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}