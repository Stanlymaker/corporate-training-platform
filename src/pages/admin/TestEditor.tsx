import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/ui/icon';
import TestInfoForm from '@/components/admin/TestInfoForm';
import TestSummary from '@/components/admin/TestSummary';
import TestQuestionsList from '@/components/admin/TestQuestionsList';
import QuestionDialog from '@/components/admin/QuestionDialog';
import TestEditorHeader from '@/components/admin/test-editor/TestEditorHeader';
import DeleteTestDialog from '@/components/admin/test-editor/DeleteTestDialog';
import { useTestEditorActions } from '@/components/admin/test-editor/useTestEditorActions';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Button } from '@/components/ui/button';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id?: number;
  type: 'single' | 'multiple' | 'text' | 'matching';
  question: string;
  imageUrl?: string;
  answers?: Answer[];
  correctText?: string;
  points: number;
  matchingPairs?: { left: string; right: string }[];
  textCheckType?: 'manual' | 'automatic';
}

interface TestFormData {
  title: string;
  description: string;
  passScore: number;
  timeLimit: number;
  attempts: number;
  status: 'draft' | 'published';
  questions: Question[];
}

const initialFormData: TestFormData = {
  title: '',
  description: '',
  passScore: 70,
  timeLimit: 30,
  attempts: 3,
  status: 'draft',
  questions: [],
};

export default function TestEditor() {
  const { testId } = useParams();
  const isEditMode = !!testId;

  const [formData, setFormData] = useState<TestFormData>(initialFormData);
  const [savedStatus, setSavedStatus] = useState<'draft' | 'published'>('draft');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [linkedCourses, setLinkedCourses] = useState<any[]>([]);

  const {
    loading,
    loadingTest,
    loadTest,
    handleSaveTest,
    handleCopyTest,
    handleDeleteTest,
  } = useTestEditorActions(testId, isEditMode, formData, setFormData);

  useEffect(() => {
    if (isEditMode && testId) {
      loadTest(testId).then((status) => {
        if (status) {
          setSavedStatus(status);
        }
      });
    }
  }, [testId, isEditMode]);



  const handleInputChange = async (field: keyof TestFormData, value: string | number) => {
    // Если меняем статус с published на draft - показываем предупреждение
    if (field === 'status' && value === 'draft' && savedStatus === 'published' && isEditMode) {
      const linked = await checkLinkedCourses();
      if (linked.length > 0) {
        setLinkedCourses(linked);
        setShowStatusChangeDialog(true);
        return; // Не меняем статус пока пользователь не подтвердит
      }
    }
    
    setFormData({ ...formData, [field]: value });
  };

  const checkLinkedCourses = async () => {
    try {
      const testRes = await fetch(`${API_ENDPOINTS.TESTS}?id=${testId}`, { headers: getAuthHeaders() });
      if (!testRes.ok) {
        console.log('Test not found:', testId);
        return [];
      }
      
      const testData = await testRes.json();
      const testIdValue = testData.test.id;

      const [coursesRes, lessonsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.COURSES}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.LESSONS}`, { headers: getAuthHeaders() }),
      ]);

      if (!coursesRes.ok || !lessonsRes.ok) return [];

      const coursesData = await coursesRes.json();
      const lessonsData = await lessonsRes.json();
      const courses = coursesData.courses || [];
      const allLessons = lessonsData.lessons || [];

      const linked = courses.filter((course: any) => {
        const courseLessons = allLessons.filter((l: any) => l.courseId === course.id);
        const hasTest = courseLessons.some((lesson: any) => lesson.testId === testIdValue);
        // Показываем только опубликованные курсы
        return hasTest && course.status === 'published';
      });

      return linked;
    } catch (error) {
      console.error('Error checking linked courses:', error);
      return [];
    }
  };

  const handleSaveWithCheck = async () => {
    if (isEditMode && savedStatus === 'published' && formData.status === 'draft') {
      const linked = await checkLinkedCourses();
      if (linked.length > 0) {
        setLinkedCourses(linked);
        setShowStatusChangeDialog(true);
        return;
      }
    }
    await handleSaveTest();
    setSavedStatus(formData.status);
  };

  const confirmStatusChange = async () => {
    setShowStatusChangeDialog(false);
    setLinkedCourses([]);
    // Меняем статус на draft
    setFormData({ ...formData, status: 'draft' });
  };

  const cancelStatusChange = () => {
    setShowStatusChangeDialog(false);
    setLinkedCourses([]);
    // Оставляем статус без изменений (published)
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      type: 'single',
      question: '',
      answers: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
      ],
      points: 1,
    });
    setShowQuestionDialog(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionDialog(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    const existingIndex = formData.questions.findIndex(q => q.id === editingQuestion.id);
    if (existingIndex >= 0) {
      const updated = [...formData.questions];
      updated[existingIndex] = editingQuestion;
      setFormData({ ...formData, questions: updated });
    } else {
      setFormData({ ...formData, questions: [...formData.questions, editingQuestion] });
    }

    setShowQuestionDialog(false);
    setEditingQuestion(null);
  };

  const handleCancelQuestion = () => {
    setShowQuestionDialog(false);
    setEditingQuestion(null);
  };

  const handleQuestionChange = (field: keyof Question, value: any) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, [field]: value });
  };

  const handleDeleteQuestion = (questionId: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== questionId),
    });
  };

  const handleReorderQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = formData.questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formData.questions.length) return;

    const updatedQuestions = [...formData.questions];
    const [movedQuestion] = updatedQuestions.splice(currentIndex, 1);
    updatedQuestions.splice(newIndex, 0, movedQuestion);

    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleAddAnswer = () => {
    if (!editingQuestion || !editingQuestion.answers) return;
    
    const nextId = editingQuestion.answers.length > 0 
      ? Math.max(...editingQuestion.answers.map(a => parseInt(a.id) || 0)) + 1 
      : 1;
    
    setEditingQuestion({
      ...editingQuestion,
      answers: [
        ...editingQuestion.answers,
        { id: nextId.toString(), text: '', isCorrect: false },
      ],
    });
  };

  const handleRemoveAnswer = (answerId: string) => {
    if (!editingQuestion || !editingQuestion.answers) return;
    
    setEditingQuestion({
      ...editingQuestion,
      answers: editingQuestion.answers.filter(a => a.id !== answerId),
    });
  };

  const handleUpdateAnswer = (answerId: string, field: keyof Answer, value: string | boolean) => {
    if (!editingQuestion || !editingQuestion.answers) return;

    const updatedAnswers = editingQuestion.answers.map(a =>
      a.id === answerId ? { ...a, [field]: value } : a
    );

    if (field === 'isCorrect' && editingQuestion.type === 'single' && value === true) {
      updatedAnswers.forEach(a => {
        if (a.id !== answerId) a.isCorrect = false;
      });
    }

    setEditingQuestion({
      ...editingQuestion,
      answers: updatedAnswers,
    });
  };

  const onDeleteConfirm = async () => {
    await handleDeleteTest();
    setShowDeleteDialog(false);
  };

  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Один вариант';
      case 'multiple': return 'Несколько вариантов';
      case 'text': return 'Текстовый ответ';
      default: return type;
    }
  };

  if (loadingTest) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка теста...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <TestEditorHeader
        isEditMode={isEditMode}
        formTitle={formData.title}
        loading={loading}
        hasQuestions={formData.questions.length > 0}
        onSave={handleSaveWithCheck}
        onCopy={handleCopyTest}
        onDelete={() => setShowDeleteDialog(true)}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TestInfoForm
              formData={formData}
              onInputChange={handleInputChange}
              isEditMode={isEditMode}
              savedStatus={savedStatus}
            />
          </div>

          <TestSummary
            questions={formData.questions}
            totalPoints={totalPoints}
            formData={formData}
          />
        </div>

        <TestQuestionsList
          questions={formData.questions}
          onAddQuestion={handleAddQuestion}
          onEditQuestion={handleEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onReorderQuestion={handleReorderQuestion}
          getQuestionTypeLabel={getQuestionTypeLabel}
          isDisabled={isEditMode && savedStatus === 'published'}
        />
      </div>

      <QuestionDialog
        show={showQuestionDialog}
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onCancel={handleCancelQuestion}
        onQuestionChange={handleQuestionChange}
        onAddAnswer={handleAddAnswer}
        onRemoveAnswer={handleRemoveAnswer}
        onUpdateAnswer={handleUpdateAnswer}
      />

      <DeleteTestDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        testTitle={formData.title}
        questionsCount={formData.questions.length}
        loading={loading}
        onConfirm={onDeleteConfirm}
      />

      {showStatusChangeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="AlertTriangle" size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Тест используется в опубликованных курсах
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Этот тест используется в следующих опубликованных курсах:
                </p>
                <ul className="space-y-1 mb-4">
                  {linkedCourses.map((course: any) => (
                    <li key={course.id} className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Icon name="BookOpen" size={14} className="text-orange-500" />
                      {course.title}
                      {course.status === 'published' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Опубликован</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ Эти курсы автоматически перейдут в статус "Черновик" и станут недоступны студентам после того, как вы сохраните тест. Вам нужно будет опубликовать их заново.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelStatusChange}>
                Отмена
              </Button>
              <Button onClick={confirmStatusChange} className="bg-amber-600 hover:bg-amber-700">
                Понятно, перевести в черновик
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}