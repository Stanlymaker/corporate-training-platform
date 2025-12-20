import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Student {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface AssignStudentsModalProps {
  show: boolean;
  courseId: number;
  courseTitle: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignStudentsModal({
  show,
  courseId,
  courseTitle,
  onClose,
  onAssigned,
}: AssignStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<Set<number>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRevokeWarning, setShowRevokeWarning] = useState(false);
  const [studentsWithProgress, setStudentsWithProgress] = useState<Student[]>([]);
  const [studentsToRevoke, setStudentsToRevoke] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      loadStudents();
    }
  }, [show, courseId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const usersRes = await fetch(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });

      if (usersRes.ok) {
        const data = await usersRes.json();
        const studentUsers = (data.users || []).filter((u: any) => u.role === 'student' && u.isActive);
        setStudents(studentUsers);

        const assignmentsRes = await fetch(`${API_ENDPOINTS.ASSIGNMENTS}?courseId=${courseId}`, {
          headers: getAuthHeaders(),
        });

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json();
          const assigned = new Set((assignmentsData.assignments || []).map((a: any) => a.userId));
          setAssignedStudents(assigned);
          setSelectedStudents(assigned);
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSave = async () => {
    const studentsToUnassign = Array.from(assignedStudents).filter(id => !selectedStudents.has(id));
    
    if (studentsToUnassign.length > 0) {
      // Проверяем прогресс у всех удаляемых студентов
      const studentsWithProgressList: Student[] = [];
      
      for (const studentId of studentsToUnassign) {
        try {
          const progressRes = await fetch(
            `${API_ENDPOINTS.PROGRESS}?userId=${studentId}&courseId=${courseId}`,
            { headers: getAuthHeaders() }
          );
          
          if (progressRes.ok) {
            const data = await progressRes.json();
            const progress = data.progress?.[0];
            
            if (progress && (progress.completedLessons > 0 || progress.lastAccessedLesson)) {
              const student = students.find(s => s.id === studentId);
              if (student) {
                studentsWithProgressList.push(student);
              }
            }
          }
        } catch (error) {
          console.error('Error checking progress:', error);
        }
      }
      
      setStudentsWithProgress(studentsWithProgressList);
      setStudentsToRevoke(studentsToUnassign);
      setShowRevokeWarning(true);
      return;
    }
    
    await performSave();
  };

  const performSave = async () => {
    setSaving(true);
    try {
      const studentsToAssign = Array.from(selectedStudents).filter(id => !assignedStudents.has(id));
      const studentsToUnassign = studentsToRevoke.length > 0 ? studentsToRevoke : [];

      for (const studentId of studentsToAssign) {
        await fetch(API_ENDPOINTS.ASSIGNMENTS, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            courseId,
            userId: studentId,
          }),
        });
      }

      for (const studentId of studentsToUnassign) {
        await fetch(`${API_ENDPOINTS.ASSIGNMENTS}?courseId=${courseId}&userId=${studentId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        
        // Сбрасываем прогресс
        await fetch(`${API_ENDPOINTS.PROGRESS}?userId=${studentId}&courseId=${courseId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      }

      setShowRevokeWarning(false);
      setStudentsWithProgress([]);
      setStudentsToRevoke([]);
      onAssigned();
      onClose();
    } catch (error) {
      console.error('Error assigning students:', error);
      alert('Ошибка при назначении студентов');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AlertDialog open={showRevokeWarning} onOpenChange={setShowRevokeWarning}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={24} className="text-orange-500" />
              Отзыв доступа у {studentsToRevoke.length} {studentsToRevoke.length === 1 ? 'студента' : 'студентов'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Вы собираетесь отозвать доступ к курсу <strong>"{courseTitle}"</strong> у следующих студентов:
              </p>
              
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-1">
                {studentsToRevoke.map(studentId => {
                  const student = students.find(s => s.id === studentId);
                  return (
                    <div key={studentId} className="text-sm">
                      <strong>{student?.name}</strong> ({student?.email})
                    </div>
                  );
                })}
              </div>
              
              {studentsWithProgress.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon name="AlertCircle" size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-semibold text-orange-900">
                        ⚠️ Будет сброшен прогресс у {studentsWithProgress.length} {studentsWithProgress.length === 1 ? 'студента' : 'студентов'}!
                      </p>
                      <p className="text-sm text-orange-800">
                        У следующих студентов есть прогресс по этому курсу:
                      </p>
                      <div className="max-h-24 overflow-y-auto bg-orange-100/50 rounded p-2 space-y-1">
                        {studentsWithProgress.map(student => (
                          <div key={student.id} className="text-sm text-orange-900">
                            • {student.name}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-orange-800 font-medium">
                        При отзыве доступа у них:
                      </p>
                      <ul className="text-sm text-orange-800 list-disc list-inside space-y-1 ml-2">
                        <li>Все пройденные уроки будут сброшены</li>
                        <li>Результаты тестов будут удалены</li>
                        <li>Статус курса станет "Не начат"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                Это действие нельзя отменить. Продолжить?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRevokeWarning(false);
              setStudentsWithProgress([]);
              setStudentsToRevoke([]);
            }}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performSave}
              className="bg-red-600 hover:bg-red-700"
            >
              <Icon name="Trash2" size={14} className="mr-2" />
              Отозвать и сбросить прогресс
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Users" size={20} />
            Назначить студентов на курс
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">{courseTitle}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 py-4">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="UserX" size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Нет активных студентов</p>
                </div>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => handleToggleStudent(student.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600 truncate">{student.email}</p>
                    </div>
                    {assignedStudents.has(student.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Назначен
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                Выбрано: {selectedStudents.size} из {students.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Назначить'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
        variant === 'secondary' ? 'bg-gray-100 text-gray-800' : 'bg-primary text-white'
      } ${className}`}
    >
      {children}
    </span>
  );
}