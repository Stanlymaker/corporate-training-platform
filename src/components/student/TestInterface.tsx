import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Test } from './types';

interface TestInterfaceProps {
  test: Test;
  testStarted: boolean;
  testSubmitted: boolean;
  testAnswers: Record<number, number>;
  testScore: number;
  timeRemaining: number;
  currentQuestionIndex: number;
  onStartTest: () => void;
  onAnswerChange: (questionId: number, answerIndex: number) => void;
  onSubmitTest: () => void;
  onRetry: () => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
}

export default function TestInterface({
  test,
  testStarted,
  testSubmitted,
  testAnswers,
  testScore,
  timeRemaining,
  currentQuestionIndex,
  onStartTest,
  onAnswerChange,
  onSubmitTest,
  onRetry,
  onNextQuestion,
  onPreviousQuestion
}: TestInterfaceProps) {
  if (!testStarted) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">{test.title}</h3>
          <p className="text-gray-600 mb-6">{test.description}</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Icon name="HelpCircle" size={20} className="text-primary" />
              <div>
                <div className="text-sm text-gray-500">Вопросов</div>
                <div className="font-bold">{test.questionsCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Clock" size={20} className="text-primary" />
              <div>
                <div className="text-sm text-gray-500">Время</div>
                <div className="font-bold">{test.timeLimit} мин</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Target" size={20} className="text-primary" />
              <div>
                <div className="text-sm text-gray-500">Проходной балл</div>
                <div className="font-bold">{test.passingScore}%</div>
              </div>
            </div>
          </div>
          <Button onClick={onStartTest} className="w-full" size="lg">
            <Icon name="PlayCircle" size={20} className="mr-2" />
            Начать тестирование
          </Button>
        </div>
      </div>
    );
  }

  if (!testSubmitted) {
    const currentQuestion = test.questions?.[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === (test.questions?.length || 0) - 1;
    const allQuestionsAnswered = Object.keys(testAnswers).length === (test.questions?.length || 0);
    
    if (!currentQuestion) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Icon name="Clock" size={20} className="text-yellow-600" />
            <span className="font-medium">Осталось времени:</span>
          </div>
          <span className="text-xl font-bold text-yellow-600">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>

        <div className="text-center text-sm text-gray-500 mb-4">
          Вопрос {currentQuestionIndex + 1} из {test.questions?.length || 0}
        </div>
        
        <div className="p-6 border rounded-lg">
          {currentQuestion.imageUrl && (
            <img 
              src={currentQuestion.imageUrl} 
              alt="Вопрос" 
              className="w-full max-h-64 object-contain rounded-lg mb-4"
            />
          )}
          
          <h4 className="font-bold mb-4 text-lg">
            {currentQuestion.question}
          </h4>
          
          <div className="space-y-2">
            {currentQuestion.options?.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  testAnswers[currentQuestion.id] === optionIndex
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={testAnswers[currentQuestion.id] === optionIndex}
                  onChange={() => onAnswerChange(currentQuestion.id, optionIndex)}
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <Button 
            onClick={onPreviousQuestion}
            variant="outline"
            disabled={currentQuestionIndex === 0}
          >
            <Icon name="ChevronLeft" size={20} className="mr-2" />
            Назад
          </Button>

          {isLastQuestion ? (
            <Button 
              onClick={onSubmitTest}
              disabled={!allQuestionsAnswered}
              className="flex-1"
            >
              <Icon name="CheckCircle" size={20} className="mr-2" />
              Завершить тестирование
            </Button>
          ) : (
            <Button 
              onClick={onNextQuestion}
              className="flex-1"
            >
              Далее
              <Icon name="ChevronRight" size={20} className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${
      testScore >= test.passingScore ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
    }`}>
      <div className="text-center">
        <Icon 
          name={testScore >= test.passingScore ? 'CheckCircle' : 'XCircle'} 
          size={64} 
          className={`mx-auto mb-4 ${testScore >= test.passingScore ? 'text-green-500' : 'text-red-500'}`}
        />
        <h3 className="text-2xl font-bold mb-2">
          {testScore >= test.passingScore ? 'Тест пройден!' : 'Тест не пройден'}
        </h3>
        <p className="text-xl mb-4">
          Ваш результат: <span className="font-bold">{testScore}%</span>
        </p>
        <p className="text-gray-600 mb-6">
          Проходной балл: {test.passingScore}%
        </p>
        {testScore < test.passingScore && (
          <Button onClick={onRetry}>
            <Icon name="RotateCcw" size={16} className="mr-2" />
            Попробовать снова
          </Button>
        )}
      </div>
    </div>
  );
}