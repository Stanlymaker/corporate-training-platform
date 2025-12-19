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
  onStartTest: () => void;
  onAnswerChange: (questionId: number, answerIndex: number) => void;
  onSubmitTest: () => void;
  onRetry: () => void;
}

export default function TestInterface({
  test,
  testStarted,
  testSubmitted,
  testAnswers,
  testScore,
  timeRemaining,
  onStartTest,
  onAnswerChange,
  onSubmitTest,
  onRetry
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
        
        {test.questions?.map((question, index) => (
          <div key={question.id} className="p-6 border rounded-lg">
            <h4 className="font-bold mb-4">
              {index + 1}. {question.question}
            </h4>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    testAnswers[question.id] === optionIndex
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={testAnswers[question.id] === optionIndex}
                    onChange={() => onAnswerChange(question.id, optionIndex)}
                    className="w-4 h-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        <Button 
          onClick={onSubmitTest} 
          className="w-full" 
          size="lg"
          disabled={Object.keys(testAnswers).length < (test.questions?.length || 0)}
        >
          <Icon name="CheckCircle" size={20} className="mr-2" />
          Завершить тестирование
        </Button>
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