import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import TestInfoForm from '@/components/admin/TestInfoForm';
import TestSummary from '@/components/admin/TestSummary';
import TestQuestionsList from '@/components/admin/TestQuestionsList';
import QuestionDialog from '@/components/admin/QuestionDialog';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'matching';
  question: string;
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
  const navigate = useNavigate();
  const { testId } = useParams();
  const isEditMode = !!testId;

  const [formData, setFormData] = useState<TestFormData>(initialFormData);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && testId) {
      loadTest(testId);
    }
  }, [testId, isEditMode]);

  const loadTest = async (id: string) => {
    setLoadingTest(true);
    try {
      const [testRes, questionsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.TESTS}?id=${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.TESTS}?testId=${id}&action=questions`, { headers: getAuthHeaders() }),
      ]);

      if (testRes.ok && questionsRes.ok) {
        const testData = await testRes.json();
        const questionsData = await questionsRes.json();
        
        setFormData({
          title: testData.test.title || '',
          description: testData.test.description || '',
          passScore: testData.test.passScore || 70,
          timeLimit: testData.test.timeLimit || 30,
          attempts: testData.test.attempts || 3,
          status: testData.test.status || 'draft',
          questions: (questionsData.questions || []).map((q: any) => ({
            id: q.id,
            type: q.type,
            question: q.text,
            answers: q.options ? JSON.parse(q.options).map((opt: string, idx: number) => ({
              id: `${idx}`,
              text: opt,
              isCorrect: JSON.parse(q.correctAnswer).includes(idx),
            })) : [],
            correctText: q.type === 'text' ? JSON.parse(q.correctAnswer) : undefined,
            points: q.points,
            matchingPairs: q.matchingPairs ? JSON.parse(q.matchingPairs) : undefined,
            textCheckType: q.textCheckType,
          })),
        });
      }
    } catch (error) {
      console.error('Error loading test:', error);
    } finally {
      setLoadingTest(false);
    }
  };

  const handleInputChange = (field: keyof TestFormData, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      id: Date.now().toString(),
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

  const handleAddAnswer = () => {
    if (!editingQuestion || !editingQuestion.answers) return;
    
    setEditingQuestion({
      ...editingQuestion,
      answers: [
        ...editingQuestion.answers,
        { id: Date.now().toString(), text: '', isCorrect: false },
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

  const handleSaveTest = async () => {
    if (!formData.title.trim()) {
      alert('Введите название теста');
      return;
    }

    setLoading(true);
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `${API_ENDPOINTS.TESTS}?id=${testId}` : API_ENDPOINTS.TESTS;

      const testPayload = {
        title: formData.title,
        description: formData.description,
        passScore: formData.passScore,
        timeLimit: formData.timeLimit,
        attempts: formData.attempts,
        status: formData.status,
      };

      const testRes = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(testPayload),
      });

      if (!testRes.ok) {
        throw new Error('Failed to save test');
      }

      const testData = await testRes.json();
      const savedTestId = testData.test.id;

      for (let i = 0; i < formData.questions.length; i++) {
        const question = formData.questions[i];
        
        let correctAnswer: any;
        let options: string[] | undefined;

        if (question.type === 'single') {
          const correctIndex = question.answers?.findIndex(a => a.isCorrect);
          correctAnswer = correctIndex !== -1 ? correctIndex : 0;
          options = question.answers?.map(a => a.text) || [];
        } else if (question.type === 'multiple') {
          correctAnswer = question.answers?.map((a, idx) => a.isCorrect ? idx : -1).filter(idx => idx !== -1) || [];
          options = question.answers?.map(a => a.text) || [];
        } else if (question.type === 'text') {
          correctAnswer = question.correctText || '';
        } else if (question.type === 'matching') {
          correctAnswer = question.matchingPairs || [];
        }

        const questionPayload = {
          testId: savedTestId,
          type: question.type,
          text: question.question,
          options: options,
          correctAnswer: correctAnswer,
          points: question.points,
          order: i,
          matchingPairs: question.type === 'matching' ? question.matchingPairs : undefined,
          textCheckType: question.type === 'text' ? (question.textCheckType || 'manual') : undefined,
        };

        await fetch(`${API_ENDPOINTS.TESTS}?action=question`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(questionPayload),
        });
      }

      navigate(ROUTES.ADMIN.TESTS);
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Ошибка при сохранении теста');
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              className="mb-2"
              onClick={() => navigate(ROUTES.ADMIN.TESTS)}
            >
              <Icon name="ArrowLeft" className="mr-2" size={16} />
              Назад к тестам
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Редактировать тест' : 'Создать новый тест'}
            </h1>
          </div>
          <Button
            onClick={handleSaveTest}
            disabled={!formData.title || formData.questions.length === 0 || loading}
          >
            <Icon name="Save" className="mr-2" size={16} />
            {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать тест'}
          </Button>
        </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TestInfoForm
              formData={formData}
              onInputChange={handleInputChange}
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
          getQuestionTypeLabel={getQuestionTypeLabel}
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
    </AdminLayout>
  );
}