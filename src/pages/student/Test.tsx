import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockQuestions } from '@/data/mockData';
import { ROUTES } from '@/constants/routes';

export default function Test() {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = mockCourses.find(c => c.id === id);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  if (!course) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Тест не найден</h2>
          <Button onClick={() => navigate(ROUTES.STUDENT.COURSES)}>
            Вернуться к курсам
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const questions = mockQuestions;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleSingleAnswer = (value: string) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleMultipleAnswer = (value: string, checked: boolean) => {
    const currentAnswers = (answers[question.id] as string[]) || [];
    const newAnswers = checked
      ? [...currentAnswers, value]
      : currentAnswers.filter(a => a !== value);
    setAnswers({ ...answers, [question.id]: newAnswers });
  };

  const calculateScore = () => {
    let totalScore = 0;
    let earnedScore = 0;

    questions.forEach(q => {
      totalScore += q.points;
      const userAnswer = answers[q.id];
      
      if (q.type === 'single') {
        if (userAnswer === q.correctAnswer) {
          earnedScore += q.points;
        }
      } else if (q.type === 'multiple') {
        const correctAnswers = q.correctAnswer as string[];
        const userAnswers = (userAnswer as string[]) || [];
        
        if (
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every(a => userAnswers.includes(a))
        ) {
          earnedScore += q.points;
        }
      }
    });

    return Math.round((earnedScore / totalScore) * 100);
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

  const handleSubmit = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
  };

  if (showResults) {
    const passed = score >= course.passScore;

    return (
      <StudentLayout>
        <div className="animate-fade-in max-w-3xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
                passed ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <Icon
                  name={passed ? 'Trophy' : 'Target'}
                  size={64}
                  className={passed ? 'text-green-600' : 'text-orange-600'}
                />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {passed ? 'Поздравляем!' : 'Попробуйте еще раз'}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                {passed
                  ? 'Вы успешно прошли тест!'
                  : `Для прохождения теста необходимо набрать минимум ${course.passScore}%`}
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">{score}%</div>
                  <div className="text-sm text-gray-600">Ваш результат</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {questions.filter(q => {
                      const userAnswer = answers[q.id];
                      if (q.type === 'single') return userAnswer === q.correctAnswer;
                      if (q.type === 'multiple') {
                        const correct = q.correctAnswer as string[];
                        const user = (userAnswer as string[]) || [];
                        return correct.length === user.length && correct.every(a => user.includes(a));
                      }
                      return false;
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">Правильных ответов</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{questions.length}</div>
                  <div className="text-sm text-gray-600">Всего вопросов</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                {!passed && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    onClick={() => {
                      setShowResults(false);
                      setCurrentQuestion(0);
                      setAnswers({});
                    }}
                  >
                    <Icon name="RotateCcw" className="mr-2" size={18} />
                    Пройти повторно
                  </Button>
                )}
                <Button
                  size="lg"
                  variant={passed ? 'default' : 'outline'}
                  onClick={() => navigate(ROUTES.STUDENT.COURSE_DETAIL.replace(':id', course.id))}
                >
                  <Icon name="ArrowLeft" className="mr-2" size={18} />
                  Вернуться к курсу
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Тест: {course.title}</h1>
            <Button variant="ghost" onClick={() => navigate(ROUTES.STUDENT.COURSE_DETAIL.replace(':id', course.id))}>
              <Icon name="X" size={20} />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Вопрос {currentQuestion + 1} из {questions.length}</span>
              <span>{Math.round(progress)}% завершено</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{question.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === 'single' && (
              <RadioGroup
                value={answers[question.id] as string}
                onValueChange={handleSingleAnswer}
              >
                {question.options?.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'multiple' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">Выберите все подходящие варианты</p>
                {question.options?.map((option, index) => {
                  const isChecked = ((answers[question.id] as string[]) || []).includes(option);
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
                    >
                      <Checkbox
                        id={`option-${index}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleMultipleAnswer(option, checked as boolean)}
                      />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Назад
              </Button>

              {currentQuestion === questions.length - 1 ? (
                <Button
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  onClick={handleSubmit}
                  disabled={!answers[question.id]}
                >
                  <Icon name="CheckCircle" className="mr-2" size={16} />
                  Завершить тест
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!answers[question.id]}
                >
                  Далее
                  <Icon name="ArrowRight" className="ml-2" size={16} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(index)}
              className={`h-10 rounded-lg font-medium transition-colors ${
                index === currentQuestion
                  ? 'bg-orange-500 text-white'
                  : answers[q.id]
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
