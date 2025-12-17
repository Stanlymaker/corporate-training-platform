import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, CourseAssignment, Course } from '@/types';
import { mockCourses, mockProgress } from '@/data/mockData';
import { useState } from 'react';

interface UserDetailsModalProps {
  show: boolean;
  user: User | null;
  onClose: () => void;
  onEditRole: (userId: string, newRole: 'admin' | 'student') => void;
  userProgress: { total: number; completed: number };
  onAssignCourse?: (userId: string, courseId: string) => void;
  onRemoveAssignment?: (assignmentId: string) => void;
  assignments: CourseAssignment[];
}

export default function UserDetailsModal({
  show,
  user,
  onClose,
  onEditRole,
  userProgress,
  onAssignCourse,
  onRemoveAssignment,
  assignments,
}: UserDetailsModalProps) {
  if (!show || !user) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <h3 className="text-xl font-bold">Детали пользователя</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-gray-900">{user.name}</h4>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                  {user.role === 'admin' ? 'Администратор' : 'Обучающийся'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Дата регистрации</div>
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={16} className="text-gray-400" />
                  <span className="font-medium">{user.registrationDate}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Последняя активность</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{user.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Курсов в процессе</div>
                <div className="flex items-center gap-2">
                  <Icon name="BookOpen" size={16} className="text-gray-400" />
                  <span className="font-medium">{userProgress.total}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Курсов завершено</div>
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={16} className="text-green-500" />
                  <span className="font-medium">{userProgress.completed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h5 className="font-bold mb-4">Управление ролями</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Роль пользователя</div>
                  <div className="text-sm text-gray-500">
                    Изменить права доступа в системе
                  </div>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => onEditRole(user.id, e.target.value as 'admin' | 'student')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="student">Обучающийся</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
          </div>

          {user.role === 'student' && (
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
                      
                      return (
                        <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium text-gray-900">{course.title}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {course.lessonsCount} уроков • {course.duration} мин
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={courseStatus.color}>
                              {courseStatus.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Lock" size={16} className="text-gray-400" />
                    <h6 className="font-semibold text-gray-700">Закрытые курсы</h6>
                  </div>
                  <div className="space-y-2">
                    {mockCourses.filter(c => c.accessType === 'closed').map((course) => {
                      const courseStatus = getCourseStatus(course);
                      const assignment = userAssignments.find(a => a.courseId === course.id);
                      
                      return (
                        <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium text-gray-900">{course.title}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {course.lessonsCount} уроков • {course.duration} мин
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={courseStatus.color}>
                              {courseStatus.label}
                            </Badge>
                            
                            {courseStatus.status === 'not_assigned' && onAssignCourse && (
                              <Button
                                size="sm"
                                onClick={() => onAssignCourse(user.id, course.id)}
                                className="whitespace-nowrap"
                              >
                                <Icon name="Plus" size={14} className="mr-1" />
                                Назначить
                              </Button>
                            )}
                            
                            {assignment && onRemoveAssignment && courseStatus.status !== 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRemoveAssignment(assignment.id)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 whitespace-nowrap"
                              >
                                <Icon name="XCircle" size={14} className="mr-1" />
                                Закрыть доступ
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}