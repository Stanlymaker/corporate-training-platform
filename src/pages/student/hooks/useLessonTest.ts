import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Course, Lesson, Test } from '@/components/student/types';

interface UseLessonTestProps {
  lesson: Lesson | null;
  test: Test | null;
  course: Course | null;
  nextLesson: Lesson | null;
  attemptsInfo: {
    attemptsUsed: number;
    remainingAttempts: number;
    maxAttempts: number | null;
    hasUnlimitedAttempts: boolean;
  } | null;
  setAttemptsInfo: (info: any) => void;
  setIsCompleted: (val: boolean) => void;
  loadLessonData: () => Promise<void>;
  onNavigateToLesson: (order: number) => void;
}

export function useLessonTest({
  lesson,
  test,
  course,
  nextLesson,
  attemptsInfo,
  setAttemptsInfo,
  setIsCompleted,
  loadLessonData,
  onNavigateToLesson
}: UseLessonTestProps) {
  const [testStarted, setTestStarted] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<number, any>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number>(0);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAttemptsWarning, setShowAttemptsWarning] = useState(false);

  useEffect(() => {
    if (!testStarted || testSubmitted || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [testStarted, testSubmitted, timeRemaining]);

  const handleStartTest = async () => {
    if (!lesson || !attemptsInfo) return;

    if (!attemptsInfo.hasUnlimitedAttempts && attemptsInfo.remainingAttempts <= 0) {
      alert('У вас закончились попытки прохождения этого теста');
      return;
    }

    if (!attemptsInfo.hasUnlimitedAttempts) {
      setShowAttemptsWarning(true);
      return;
    }

    startTestExecution();
  };

  const startTestExecution = async () => {
    if (!lesson || !test) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.TEST_ATTEMPTS}?action=start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ lessonId: lesson.id })
      });

      if (response.ok) {
        const data = await response.json();
        setAttemptsInfo((prev: any) => prev ? {
          ...prev,
          attemptsUsed: data.attemptsUsed,
          remainingAttempts: data.remainingAttempts
        } : null);

        setTestStarted(true);
        setTimeRemaining(test.timeLimit ? test.timeLimit * 60 : 0);
        setTestAnswers({});
        setTestSubmitted(false);
        setCurrentQuestionIndex(0);
      } else {
        const error = await response.json();
        alert(error.error || 'Не удалось начать тест');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Произошла ошибка при начале тестирования');
    }
  };

  const handleConfirmStart = async () => {
    setShowAttemptsWarning(false);
    await startTestExecution();
  };

  const handleCancelStart = () => {
    setShowAttemptsWarning(false);
  };

  const handleAnswerChange = (questionId: number, answerValue: any, isMultiple?: boolean) => {
    if (isMultiple) {
      setTestAnswers(prev => {
        const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        const newAnswers = currentAnswers.includes(answerValue)
          ? currentAnswers.filter((a: any) => a !== answerValue)
          : [...currentAnswers, answerValue];
        return { ...prev, [questionId]: newAnswers };
      });
    } else {
      setTestAnswers(prev => ({ ...prev, [questionId]: answerValue }));
    }
  };

  const handleSubmitTest = async () => {
    if (!test || !course || !lesson) return;
    
    try {
      // Отправляем ответы на бэкенд для проверки
      const response = await fetch(`${API_ENDPOINTS.TESTS}?action=check`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          testId: test.id,
          answers: testAnswers
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка проверки теста');
      }

      const result = await response.json();
      
      console.log('=== Результат проверки теста ===');
      console.log('Набрано баллов:', result.earnedPoints, '/', result.totalPoints);
      console.log('Процент:', result.score + '%');
      console.log('Детали:', result.results);
      
      setTestScore(result.score);
      setEarnedPoints(result.earnedPoints);
      setTotalPoints(result.totalPoints);
      setTestSubmitted(true);
      
      const passingScore = test.passingScore || 70;
      if (result.score >= passingScore) {
        const progressResponse = await fetch(`${API_ENDPOINTS.PROGRESS}?action=complete`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            courseId: course.id,
            lessonId: String(lesson.id)
          })
        });
        
        if (progressResponse.ok) {
          setIsCompleted(true);
          await loadLessonData();
          
          if (nextLesson) {
            setTimeout(() => {
              onNavigateToLesson(nextLesson.order);
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Произошла ошибка при отправке теста. Попробуйте еще раз.');
    }
  };

  return {
    testStarted,
    testAnswers,
    testSubmitted,
    testScore,
    earnedPoints,
    totalPoints,
    timeRemaining,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    handleStartTest,
    handleAnswerChange,
    handleSubmitTest,
    showAttemptsWarning,
    handleConfirmStart,
    handleCancelStart
  };
}