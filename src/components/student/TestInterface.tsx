import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Test } from './types';
import { useMemo } from 'react';

interface TestInterfaceProps {
  test: Test;
  testStarted: boolean;
  testSubmitted: boolean;
  testAnswers: Record<number, any>;
  testScore: number;
  timeRemaining: number;
  currentQuestionIndex: number;
  onStartTest: () => void;
  onAnswerChange: (questionId: number, answerValue: any, isMultiple?: boolean) => void;
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
  const currentQuestion = test.questions?.[currentQuestionIndex];
  
  // Запоминаем порядок правых элементов один раз для текущего вопроса
  const shuffledRightItems = useMemo(() => {
    if (!currentQuestion?.matchingPairs) return [];
    return [...currentQuestion.matchingPairs]
      .sort(() => Math.random() - 0.5)
      .map(p => p.right);
  }, [currentQuestion?.id]);
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
          
          {currentQuestion.type === 'multiple' && (
            <p className="text-sm text-gray-600 mb-3">
              <Icon name="Info" size={16} className="inline mr-1" />
              Можно выбрать несколько вариантов
            </p>
          )}
          
          {currentQuestion.type === 'text' ? (
            <textarea
              value={(testAnswers[currentQuestion.id] as string) || ''}
              onChange={(e) => onAnswerChange(currentQuestion.id, e.target.value as any, false)}
              placeholder="Введите ваш ответ..."
              className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-y"
            />
          ) : currentQuestion.type === 'matching' && currentQuestion.matchingPairs ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                <Icon name="Info" size={16} className="inline mr-1" />
                Перетащите элементы справа, чтобы расставить их в правильном порядке напротив левых элементов
              </p>
              <div className="grid grid-cols-2 gap-8">
                {/* Левая колонка - статичные элементы */}
                <div className="space-y-3">
                  {currentQuestion.matchingPairs.map((pair, index) => (
                    <div
                      key={`left-${index}`}
                      className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 min-h-[60px] flex items-center"
                    >
                      <span className="font-medium text-gray-700">{pair.left}</span>
                    </div>
                  ))}
                </div>
                
                {/* Правая колонка - элементы для сортировки */}
                <div className="space-y-3">
                  {(() => {
                    // Получаем текущий порядок из ответов или используем перемешанный порядок
                    const currentOrder = (testAnswers[currentQuestion.id] as string[]) || shuffledRightItems;
                    
                    return currentOrder.map((rightItem, index) => (
                      <div
                        key={`right-${index}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text', String(index));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedIndex = parseInt(e.dataTransfer.getData('text'));
                          
                          if (draggedIndex === index) return;
                          
                          // Меняем элементы местами
                          const newOrder = [...currentOrder];
                          const draggedItem = newOrder[draggedIndex];
                          newOrder.splice(draggedIndex, 1);
                          newOrder.splice(index, 0, draggedItem);
                          
                          onAnswerChange(currentQuestion.id, newOrder, false);
                        }}
                        className="p-4 rounded-lg border-2 border-primary bg-white cursor-move hover:shadow-lg transition-all min-h-[60px] flex items-center"
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="GripVertical" size={16} className="text-gray-400" />
                          <span className="font-medium">{rightItem}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentQuestion.options?.map((option, optionIndex) => {
                const isMultiple = currentQuestion.type === 'multiple';
                const userAnswer = testAnswers[currentQuestion.id];
                const isChecked = isMultiple 
                  ? Array.isArray(userAnswer) && userAnswer.includes(optionIndex)
                  : userAnswer === optionIndex;
                
                return (
                  <label
                    key={optionIndex}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <input
                      type={isMultiple ? 'checkbox' : 'radio'}
                      name={`question-${currentQuestion.id}`}
                      checked={isChecked}
                      onChange={() => onAnswerChange(currentQuestion.id, optionIndex, isMultiple)}
                      className="w-4 h-4"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          )}
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