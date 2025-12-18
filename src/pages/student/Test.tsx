import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { mockTests, mockQuestions, mockCourses } from '@/data/mockData';
import { ROUTES } from '@/constants/routes';

export default function Test() {
  const { courseId, testId } = useParams();
  const navigate = useNavigate();

  const test = mockTests.find(t => t.id === testId);
  const course = mockCourses.find(c => c.id === courseId);
  const questions = mockQuestions.filter(q => q.testId === testId).sort((a, b) => a.order - b.order);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(test ? test.timeLimit * 60 : 0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleFinish();
    }
  }, [timeLeft, isFinished]);

  if (!test || !course) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Тест не найден</h2>
          <Button onClick={() => navigate(ROUTES.STUDENT.COURSES)}>
            Вернуться к курсам
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = () => {
    let totalScore = 0;
    let earnedPoints = 0;

    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return;

      if (q.type === 'single') {
        if (userAnswer === q.correctAnswer) {
          earnedPoints += q.points;
        }
      } else if (q.type === 'multiple') {
        const correct = q.correctAnswer as string[];
        const user = userAnswer as string[];
        if (user.length === correct.length && user.every(a => correct.includes(a))) {
          earnedPoints += q.points;
        }
      }
    });

    const maxPoints = questions.reduce((sum, q) => sum + q.points, 0);
    totalScore = Math.round((earnedPoints / maxPoints) * 100);
    
    setScore(totalScore);
    setIsFinished(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  if (isFinished) {
    const passed = score >= test.passScore;
    
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto">
          <Card className={`border-0 shadow-lg ${passed ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
            <CardContent className="p-12 text-center">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${passed ? 'bg-green-500' : 'bg-red-500'}`}>
                <Icon name={passed ? 'CheckCircle' : 'XCircle'} size={48} className="text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {passed ? 'Тест успешно пройден!' : 'Тест не пройден'}
              </h1>
              <p className="text-gray-600 mb-6">
                {passed 
                  ? 'Поздравляем! Вы успешно завершили тестирование.' 
                  : `Для прохождения необходимо набрать минимум ${test.passScore}%. Попробуйте еще раз.`
                }
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{score}%</div>
                  <div className="text-sm text-gray-600">Ваш результат</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{answeredCount}</div>
                  <div className="text-sm text-gray-600">Отвечено</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{test.passScore}%</div>
                  <div className="text-sm text-gray-600">Проходной балл</div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => navigate(ROUTES.STUDENT.COURSE_DETAIL.replace(':id', courseId!))}
                  variant="outline"
                  size="lg"
                >
                  <Icon name="ArrowLeft" size={20} className="mr-2" />
                  К курсу
                </Button>
                {!passed && (
                  <Button 
                    onClick={() => window.location.reload()}
                    size="lg"
                  >
                    <Icon name="RotateCcw" size={20} className="mr-2" />
                    Пройти заново
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  const question = questions[currentQuestion];
  const currentAnswer = answers[question.id];

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.STUDENT.COURSE_DETAIL.replace(':id', courseId!))}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад к курсу
          </Button>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{test.title}</h1>
                <p className="text-gray-600">{course.title}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-base px-4 py-2">
                  <Icon name="Clock" size={16} className="mr-2" />
                  {formatTime(timeLeft)}
                </Badge>
                <Badge variant="outline" className="text-base px-4 py-2">
                  {answeredCount} / {questions.length}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Вопрос {currentQuestion + 1} из {questions.length}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  {currentQuestion + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 leading-relaxed">{question.text}</p>
                  {question.imageUrl && (
                    <div className="mt-4">
                      <img 
                        src={question.imageUrl} 
                        alt="Изображение к вопросу" 
                        className="max-w-full max-h-96 rounded-lg border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <Badge variant="outline">
                      {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                    </Badge>
                    <span className="text-gray-500">{question.points} баллов</span>
                  </div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {question.type === 'single' && question.options && (
              <RadioGroup
                value={currentAnswer as string}
                onValueChange={(value) => handleAnswer(question.id, value)}
              >
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        currentAnswer === option
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAnswer(question.id, option)}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.type === 'multiple' && question.options && (
              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const selected = (currentAnswer as string[] || []).includes(option);
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        const current = (currentAnswer as string[]) || [];
                        const newAnswer = selected
                          ? current.filter(a => a !== option)
                          : [...current, option];
                        handleAnswer(question.id, newAnswer);
                      }}
                    >
                      <Checkbox
                        id={`option-${index}`}
                        checked={selected}
                        onCheckedChange={() => {}}
                      />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <Icon name="ChevronLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <div className="text-sm text-gray-600">
            {answeredCount === questions.length ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <Icon name="CheckCircle" size={16} />
                Все вопросы отвечены
              </span>
            ) : (
              <span>Отвечено: {answeredCount} из {questions.length}</span>
            )}
          </div>

          {currentQuestion < questions.length - 1 ? (
            <Button size="lg" onClick={handleNext}>
              Далее
              <Icon name="ChevronRight" size={20} className="ml-2" />
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={handleFinish}
              className="bg-green-600 hover:bg-green-700"
            >
              <Icon name="CheckCircle" size={20} className="mr-2" />
              Завершить тест
            </Button>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}