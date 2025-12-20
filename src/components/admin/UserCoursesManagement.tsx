import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User, CourseAssignment, Course, Lesson, CourseProgress, TestResult } from '@/types';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import CourseListItem from './user-courses/CourseListItem';
import RevokeAccessDialog from './user-courses/RevokeAccessDialog';
import TestResultsDialog from './user-courses/TestResultsDialog';

interface UserCoursesManagementProps {
  user: User;
  assignments: CourseAssignment[];
  onAssignCourse?: (userId: number, courseId: number) => void;
  onRemoveAssignment?: (assignmentId: number) => void;
}

export default function UserCoursesManagement({ 
  user, 
  assignments, 
  onAssignCourse, 
  onRemoveAssignment 
}: UserCoursesManagementProps) {
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsData, setLessonsData] = useState<Record<number, Lesson[]>>({});
  const [progressData, setProgressData] = useState<CourseProgress[]>([]);
  const [testResults, setTestResults] = useState<Record<number, TestResult[]>>({});
  const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | 'archived'>('published');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeAssignmentId, setRevokeAssignmentId] = useState<number | null>(null);
  const [revokeCourseTitle, setRevokeCourseTitle] = useState<string>('');
  const [revokeHasProgress, setRevokeHasProgress] = useState(false);
  const [showTestResultsDialog, setShowTestResultsDialog] = useState(false);
  const [selectedTestResult, setSelectedTestResult] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);

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

  const loadCourseLessons = async (courseId: number) => {
    if (lessonsData[courseId]) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setLessonsData(prev => ({ ...prev, [courseId]: data.lessons || [] }));
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadTestResults = async (courseId: number) => {
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

  const viewTestResults = async (lessonId: string, testId: number) => {
    try {
      const testResponse = await fetch(`${API_ENDPOINTS.TESTS}?id=${testId}`, { headers: getAuthHeaders() });
      if (!testResponse.ok) {
        alert('Не удалось загрузить тест');
        return;
      }
      const testData = await testResponse.json();
      setSelectedTest(testData.test);

      const resultResponse = await fetch(`${API_ENDPOINTS.TESTS}?action=results&lessonId=${lessonId}`, { 
        headers: {
          ...getAuthHeaders(),
          'X-User-Id-Override': String(user.id)
        }
      });
      
      if (!resultResponse.ok) {
        alert('Результаты теста не найдены');
        return;
      }
      
      const resultData = await resultResponse.json();
      setSelectedTestResult(resultData.result);
      setShowTestResultsDialog(true);
    } catch (error) {
      console.error('Error loading test results:', error);
      alert('Ошибка при загрузке результатов теста');
    }
  };

  const toggleCourse = async (courseId: number) => {
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

  const getCourseStatus = (course: Course) => {
    const progress = progressData.find(p => p.courseId === course.id);
    const assignment = userAssignments.find(a => a.courseId === course.id);
    const isAssigned = assignedCourseIds.includes(course.id);
    
    let progressStatus = 'not_started';
    let progressLabel = 'Не начат';
    let progressColor = 'bg-gray-100 text-gray-700';
    
    if (progress?.completed || (progress && progress.completedLessons >= progress.totalLessons && progress.totalLessons > 0)) {
      progressStatus = 'completed';
      progressLabel = 'Завершен';
      progressColor = 'bg-green-100 text-green-700';
    } else if (progress && progress.completedLessons > 0) {
      progressStatus = 'in_progress';
      progressLabel = 'Начат';
      progressColor = 'bg-yellow-100 text-yellow-700';
    } else if (progress) {
      progressStatus = 'started';
      progressLabel = 'Начат';
      progressColor = 'bg-blue-100 text-blue-700';
    }
    
    let assignmentStatus = null;
    let assignmentLabel = '';
    let assignmentColor = '';
    
    if (course.accessType === 'closed') {
      if (isAssigned) {
        assignmentStatus = 'assigned';
        assignmentLabel = 'Назначен';
        assignmentColor = 'bg-blue-100 text-blue-700';
      } else {
        assignmentStatus = 'not_assigned';
        assignmentLabel = 'Не назначен';
        assignmentColor = 'bg-gray-50 text-gray-500 border border-gray-300';
      }
    }
    
    return {
      progressStatus,
      progressLabel,
      progressColor,
      assignmentStatus,
      assignmentLabel,
      assignmentColor,
      isAssigned
    };
  };

  const handleRevokeAccess = (assignmentId: number, courseTitle: string) => {
    const assignment = userAssignments.find(a => a.id === assignmentId);
    if (assignment) {
      const progress = progressData.find(p => p.courseId === assignment.courseId);
      setRevokeAssignmentId(assignmentId);
      setRevokeCourseTitle(courseTitle);
      setRevokeHasProgress(!!progress && (progress.completedLessons > 0 || progress.lastAccessedLesson !== null));
      setShowRevokeDialog(true);
    }
  };

  const confirmRevokeAccess = async () => {
    if (revokeAssignmentId) {
      if (onRemoveAssignment) {
        onRemoveAssignment(revokeAssignmentId);
      }
      
      const assignment = userAssignments.find(a => a.id === revokeAssignmentId);
      if (assignment) {
        try {
          await fetch(`${API_ENDPOINTS.PROGRESS}?userId=${user.id}&courseId=${assignment.courseId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          
          await loadProgress();
        } catch (error) {
          console.error('Error resetting progress:', error);
        }
      }
    }
    
    setShowRevokeDialog(false);
    setRevokeAssignmentId(null);
    setRevokeCourseTitle('');
    setRevokeHasProgress(false);
  };

  const cancelRevokeAccess = () => {
    setShowRevokeDialog(false);
    setRevokeAssignmentId(null);
    setRevokeCourseTitle('');
    setRevokeHasProgress(false);
  };

  const closeTestResults = () => {
    setShowTestResultsDialog(false);
    setSelectedTest(null);
    setSelectedTestResult(null);
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

  const publishedCourses = courses.filter(c => c.status === 'published');
  const draftCourses = courses.filter(c => c.status === 'draft');
  const archivedCourses = courses.filter(c => c.status === 'archived');

  const getCoursesToShow = () => {
    switch (statusFilter) {
      case 'published': return publishedCourses;
      case 'draft': return draftCourses;
      case 'archived': return archivedCourses;
      default: return publishedCourses;
    }
  };

  const coursesToShow = getCoursesToShow();

  return (
    <div className="border-t pt-6">
      <h5 className="font-bold mb-4 flex items-center gap-2">
        <Icon name="BookOpen" size={18} />
        Все курсы и прогресс
      </h5>
      
      <div className="flex gap-2 mb-4">
        <Button
          variant={statusFilter === 'published' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('published')}
        >
          Опубликованные ({publishedCourses.length})
        </Button>
        <Button
          variant={statusFilter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('draft')}
        >
          Черновики ({draftCourses.length})
        </Button>
        <Button
          variant={statusFilter === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('archived')}
        >
          Архивные ({archivedCourses.length})
        </Button>
      </div>

      <div className="space-y-3">
        {coursesToShow.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
            <p>Нет курсов в этой категории</p>
          </div>
        ) : (
          coursesToShow.map(course => {
            const status = getCourseStatus(course);
            const progress = progressData.find(p => p.courseId === course.id);
            const lessons = lessonsData[course.id] || [];
            const courseTestResults = testResults[course.id] || [];
            const assignment = userAssignments.find(a => a.courseId === course.id);

            return (
              <CourseListItem
                key={course.id}
                course={course}
                isExpanded={expandedCourseId === course.id}
                isAssigned={status.isAssigned}
                progressStatus={status.progressStatus}
                progressLabel={status.progressLabel}
                progressColor={status.progressColor}
                assignmentStatus={status.assignmentStatus}
                assignmentLabel={status.assignmentLabel}
                assignmentColor={status.assignmentColor}
                progress={progress}
                lessons={lessons}
                testResults={courseTestResults}
                userId={user.id}
                onToggle={() => toggleCourse(course.id)}
                onAssign={() => onAssignCourse?.(user.id, course.id)}
                onRevoke={() => assignment && handleRevokeAccess(assignment.id, course.title)}
                onViewTestResults={viewTestResults}
                onReloadProgress={loadProgress}
              />
            );
          })
        )}
      </div>

      <RevokeAccessDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        userName={user.name}
        courseTitle={revokeCourseTitle}
        hasProgress={revokeHasProgress}
        onConfirm={confirmRevokeAccess}
        onCancel={cancelRevokeAccess}
      />

      <TestResultsDialog
        open={showTestResultsDialog}
        onOpenChange={setShowTestResultsDialog}
        userName={user.name}
        test={selectedTest}
        result={selectedTestResult}
        onClose={closeTestResults}
      />
    </div>
  );
}
