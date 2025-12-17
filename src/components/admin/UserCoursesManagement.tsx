import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, CourseAssignment, Course } from '@/types';
import { mockCourses, mockProgress, mockLessons, mockTests } from '@/data/mockData';
import { useState } from 'react';

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

  const userAssignments = assignments.filter(a => a.userId === user.id);
  const assignedCourseIds = userAssignments.map(a => a.courseId);
  const userProgressData = mockProgress.filter(p => p.userId === user.id);
  const completedCourseIds = userProgressData.filter(p => p.completed).map(p => p.courseId);

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
            {mockCourses.filter(c => c.accessType === 'open').map((course) => {
              const courseStatus = getCourseStatus(course);
              const isExpanded = expandedCourseId === course.id;
              const courseLessons = mockLessons.filter(l => l.courseId === course.id);
              const finalTestLessons = courseLessons.filter(l => l.type === 'test' && l.isFinalTest);
              const progressData = userProgressData.find(p => p.courseId === course.id);
              
              return (
                <div key={course.id} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <Icon 
                        name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                        size={18} 
                        className="text-gray-400"
                      />
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
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Уроки</h6>
                        <div className="space-y-1">
                          {courseLessons.map((lesson) => {
                            const lessonCompleted = progressData?.completedLessonIds.includes(lesson.id);
                            return (
                              <div key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200">
                                <div className="flex items-center gap-2">
                                  <Icon 
                                    name={lessonCompleted ? "CheckCircle" : "Circle"} 
                                    size={14} 
                                    className={lessonCompleted ? "text-green-500" : "text-gray-300"}
                                  />
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                                <span className="text-xs text-gray-500">{lesson.duration} мин</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {finalTestLessons.length > 0 && (
                        <div>
                          <h6 className="text-sm font-semibold text-gray-700 mb-2">Итоговые тесты</h6>
                          {finalTestLessons.map((lesson) => {
                            const lessonCompleted = progressData?.completedLessonIds.includes(lesson.id);
                            const test = mockTests.find(t => t.id === lesson.testId);
                            return (
                              <div key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <Icon name="ClipboardCheck" size={14} className="text-blue-600" />
                                  <span className="text-sm font-medium">{test?.title || lesson.title} (итоговый)</span>
                                </div>
                                <Badge className={lessonCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}>
                                  {lessonCompleted ? `Пройден` : 'Не пройден'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
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
            {mockCourses.filter(c => c.accessType === 'closed').map((course) => {
              const courseStatus = getCourseStatus(course);
              const isExpanded = expandedCourseId === course.id;
              const courseLessons = mockLessons.filter(l => l.courseId === course.id);
              const finalTestLessons = courseLessons.filter(l => l.type === 'test' && l.isFinalTest);
              const progressData = userProgressData.find(p => p.courseId === course.id);
              const assignment = userAssignments.find(a => a.courseId === course.id);
              const isAssigned = assignedCourseIds.includes(course.id);
              
              return (
                <div key={course.id} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <Icon 
                        name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                        size={18} 
                        className="text-gray-400"
                      />
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignCourse(user.id, course.id);
                          }}
                        >
                          <Icon name="Plus" size={14} className="mr-1" />
                          Назначить
                        </Button>
                      )}
                      {isAssigned && onRemoveAssignment && assignment && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveAssignment(assignment.id);
                          }}
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Уроки</h6>
                        <div className="space-y-1">
                          {courseLessons.map((lesson) => {
                            const lessonCompleted = progressData?.completedLessonIds.includes(lesson.id);
                            return (
                              <div key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200">
                                <div className="flex items-center gap-2">
                                  <Icon 
                                    name={lessonCompleted ? "CheckCircle" : "Circle"} 
                                    size={14} 
                                    className={lessonCompleted ? "text-green-500" : "text-gray-300"}
                                  />
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                                <span className="text-xs text-gray-500">{lesson.duration} мин</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {finalTestLessons.length > 0 && (
                        <div>
                          <h6 className="text-sm font-semibold text-gray-700 mb-2">Итоговые тесты</h6>
                          {finalTestLessons.map((lesson) => {
                            const lessonCompleted = progressData?.completedLessonIds.includes(lesson.id);
                            const test = mockTests.find(t => t.id === lesson.testId);
                            return (
                              <div key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <Icon name="ClipboardCheck" size={14} className="text-blue-600" />
                                  <span className="text-sm font-medium">{test?.title || lesson.title} (итоговый)</span>
                                </div>
                                <Badge className={lessonCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}>
                                  {lessonCompleted ? `Пройден` : 'Не пройден'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
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