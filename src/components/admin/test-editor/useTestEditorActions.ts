import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { ROUTES } from '@/constants/routes';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id?: number;
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

export function useTestEditorActions(
  testId: string | undefined,
  isEditMode: boolean,
  formData: TestFormData,
  setFormData: (data: TestFormData) => void
) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(isEditMode);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadTest = async (id: string): Promise<'draft' | 'published' | null> => {
    setLoadingTest(true);
    try {
      const testRes = await fetch(`${API_ENDPOINTS.TESTS}?id=${id}`, { headers: getAuthHeaders() });
      
      if (!testRes.ok) {
        throw new Error('Failed to load test');
      }
      
      const testData = await testRes.json();
      const testStatus = testData.test.status || 'draft';
      
      const questionsRes = await fetch(`${API_ENDPOINTS.TESTS}?testId=${id}&action=questions`, { 
        headers: getAuthHeaders() 
      });
      
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        console.log('[DEBUG loadTest] Raw questions from API:', questionsData.questions);
        
        const mappedQuestions = (questionsData.questions || []).map((q: any) => {
          console.log('[DEBUG loadTest] Mapping question:', { id: q.id, text: q.text, type: q.type });
          return {
            id: q.id,
            type: q.type,
            question: q.text,
            imageUrl: q.imageUrl,
            answers: q.options ? q.options.map((opt: string, idx: number) => ({
              id: `${idx}`,
              text: opt,
              isCorrect: Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(idx) : q.correctAnswer === idx,
            })) : [],
            correctText: q.type === 'text' ? q.correctAnswer : undefined,
            points: q.points,
            matchingPairs: q.matchingPairs || undefined,
            textCheckType: q.textCheckType,
          };
        });
        
        console.log('[DEBUG loadTest] Mapped questions:', mappedQuestions);
        
        setFormData({
          title: testData.test.title || '',
          description: testData.test.description || '',
          passScore: testData.test.passScore || 70,
          timeLimit: testData.test.timeLimit || 30,
          attempts: testData.test.attempts || 3,
          status: testStatus,
          questions: mappedQuestions,
        });
      }
      return testStatus;
    } catch (error) {
      console.error('Error loading test:', error);
      return null;
    } finally {
      setLoadingTest(false);
    }
  };

  const handleSaveTest = async () => {
    if (!formData.title.trim()) {
      alert('Введите название теста');
      return;
    }

    setLoading(true);
    setSaveSuccess(false);
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

      // Если это создание нового теста, создаём вопросы и перенаправляем
      if (!isEditMode) {
        // Сохраняем вопросы для нового теста
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

          const questionPayload: any = {
            testId: savedTestId,
            type: question.type,
            text: question.question,
            options: options,
            correctAnswer: correctAnswer,
            points: question.points,
            order: i,
          };
          
          if (question.imageUrl) {
            questionPayload.imageUrl = question.imageUrl;
            console.log('[DEBUG] Adding imageUrl to question payload:', question.imageUrl);
          } else {
            console.log('[DEBUG] No imageUrl for question:', question.question);
          }
          
          if (question.type === 'matching' && question.matchingPairs) {
            questionPayload.matchingPairs = question.matchingPairs;
          }
          
          if (question.type === 'text') {
            questionPayload.textCheckType = question.textCheckType || 'manual';
          }

          const response = await fetch(`${API_ENDPOINTS.TESTS}?action=question`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(questionPayload),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('[DEBUG] Question creation failed:', errorData);
            throw new Error(`Failed to create question: ${errorData.error || response.statusText}`);
          }
        }
        
        navigate(ROUTES.ADMIN.TESTS);
        return;
      }

      // Получаем текущие вопросы из БД, если это режим редактирования
      let existingQuestions: any[] = [];
      if (isEditMode) {
        const questionsRes = await fetch(`${API_ENDPOINTS.TESTS}?testId=${savedTestId}&action=questions`, { 
          headers: getAuthHeaders() 
        });
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          existingQuestions = questionsData.questions || [];
        }
      }

      // Определяем, какие вопросы нужно удалить (есть в БД, но нет в форме)
      const formQuestionIds = new Set(
        formData.questions
          .filter(q => q.id !== undefined)
          .map(q => q.id)
      );
      const questionsToDelete = existingQuestions.filter(q => !formQuestionIds.has(q.id));
      
      // Удаляем вопросы, которых больше нет в форме
      for (const question of questionsToDelete) {
        await fetch(`${API_ENDPOINTS.TESTS}?action=question&questionId=${question.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      }

      // Создаём или обновляем вопросы
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

        const questionPayload: any = {
          testId: savedTestId,
          type: question.type,
          text: question.question,
          options: options,
          correctAnswer: correctAnswer,
          points: question.points,
          order: i,
        };
        
        if (question.imageUrl) {
          questionPayload.imageUrl = question.imageUrl;
          console.log('[DEBUG] Adding imageUrl to question payload (edit mode):', question.imageUrl);
        } else {
          console.log('[DEBUG] No imageUrl for question (edit mode):', question.question);
        }
        
        if (question.type === 'matching' && question.matchingPairs) {
          questionPayload.matchingPairs = question.matchingPairs;
        }
        
        if (question.type === 'text') {
          questionPayload.textCheckType = question.textCheckType || 'manual';
        }

        // Проверяем, это существующий вопрос (есть id) или новый (id === undefined)
        const isNewQuestion = question.id === undefined;
        
        if (isNewQuestion) {
          // Создаём новый вопрос
          const response = await fetch(`${API_ENDPOINTS.TESTS}?action=question`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(questionPayload),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('[DEBUG] Question creation failed:', errorData);
            throw new Error(`Failed to create question: ${errorData.error || response.statusText}`);
          }
        } else {
          // Обновляем существующий вопрос
          const response = await fetch(`${API_ENDPOINTS.TESTS}?action=question&questionId=${question.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(questionPayload),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('[DEBUG] Question update failed:', errorData);
            throw new Error(`Failed to update question: ${errorData.error || response.statusText}`);
          }
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Перезагружаем данные теста из БД после сохранения
      if (isEditMode && testId) {
        await loadTest(testId);
      }
      
      // Don't navigate - stay on the page after save
      // navigate(ROUTES.ADMIN.TESTS);
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Ошибка при сохранении теста');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTest = async () => {
    if (!testId) return;

    setLoading(true);
    try {
      const newTestPayload = {
        title: `${formData.title} (копия)`,
        description: formData.description,
        passScore: formData.passScore,
        timeLimit: formData.timeLimit,
        attempts: formData.attempts,
        status: 'draft',
      };

      const createRes = await fetch(API_ENDPOINTS.TESTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newTestPayload),
      });

      if (createRes.ok) {
        const newTestData = await createRes.json();
        const newTestId = newTestData.test.id;

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
            testId: newTestId,
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

        navigate(`/admin/tests/edit/${newTestId}`);
      }
    } catch (error) {
      console.error('Error copying test:', error);
      alert('Ошибка при копировании теста');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!testId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.TESTS}?id=${testId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        navigate(ROUTES.ADMIN.TESTS);
      } else {
        throw new Error('Failed to delete test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Ошибка при удалении теста');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loadingTest,
    saveSuccess,
    loadTest,
    handleSaveTest,
    handleCopyTest,
    handleDeleteTest,
  };
}