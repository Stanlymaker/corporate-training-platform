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

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      loadTest(testId);
    }
  }, [testId, isEditMode]);

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
        onSave={handleSaveTest}
        onCopy={handleCopyTest}
        onDelete={() => setShowDeleteDialog(true)}
      />

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

      <DeleteTestDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        testTitle={formData.title}
        questionsCount={formData.questions.length}
        loading={loading}
        onConfirm={onDeleteConfirm}
      />
    </AdminLayout>
  );
}