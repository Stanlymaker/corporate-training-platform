import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
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
  type: 'single' | 'multiple' | 'text';
  question: string;
  answers?: Answer[];
  correctText?: string;
  points: number;
}

interface TestFormData {
  title: string;
  description: string;
  courseId: string;
  passingScore: number;
  timeLimit: number;
  questions: Question[];
}

const initialFormData: TestFormData = {
  title: '',
  description: '',
  courseId: '',
  passingScore: 70,
  timeLimit: 15,
  questions: [],
};

export default function TestEditor() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const isEditMode = !!testId;

  const [formData, setFormData] = useState<TestFormData>(initialFormData);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);

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

  const handleSaveTest = () => {
    console.log('Saving test:', formData);
    navigate(ROUTES.ADMIN.TESTS);
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

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
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
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            disabled={!formData.title || !formData.courseId || formData.questions.length === 0}
          >
            <Icon name="Save" className="mr-2" size={16} />
            {isEditMode ? 'Сохранить изменения' : 'Создать тест'}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <TestInfoForm
            formData={formData}
            onInputChange={handleInputChange}
          />

          <TestSummary
            questions={formData.questions}
            totalPoints={totalPoints}
          />

          <TestQuestionsList
            questions={formData.questions}
            onAddQuestion={handleAddQuestion}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            getQuestionTypeLabel={getQuestionTypeLabel}
          />
        </div>
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
