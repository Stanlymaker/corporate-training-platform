import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Test } from './types';

interface TestResultsProps {
  test: Test;
  result: {
    score: number;
    earnedPoints: number;
    totalPoints: number;
    passed: boolean;
    answers: Record<string, any>;
    results: Array<{
      questionId: string;
      isCorrect: boolean;
      points: number;
    }>;
    completedAt: string;
  };
  onRetry?: () => void;
}

export default function TestResults({ test, result, onRetry }: TestResultsProps) {
  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg border-2 ${
        result.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
      }`}>
        <div className="text-center mb-6">
          <Icon 
            name={result.passed ? 'CheckCircle' : 'XCircle'} 
            size={64} 
            className={`mx-auto mb-4 ${result.passed ? 'text-green-500' : 'text-red-500'}`}
          />
          <h3 className="text-2xl font-bold mb-2">
            {result.passed ? 'Тест пройден!' : 'Тест не пройден'}
          </h3>
          <p className="text-xl mb-2">
            Ваш результат: <span className="font-bold">{result.score}%</span>
          </p>
          <p className="text-gray-600 mb-2">
            Набрано баллов: <span className="font-semibold">{result.earnedPoints} из {result.totalPoints}</span>
          </p>
          <p className="text-gray-600 mb-4">
            Проходной балл: <span className="font-semibold">{test.passScore}%</span>
          </p>
          <p className="text-sm text-gray-500">
            Завершено: {new Date(result.completedAt).toLocaleString('ru-RU')}
          </p>
        </div>

        {!result.passed && onRetry && (
          <div className="text-center">
            <Button onClick={onRetry}>
              <Icon name="RotateCcw" size={16} className="mr-2" />
              Попробовать снова
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Icon name="List" size={20} />
          Детальные результаты
        </h4>
        
        <div className="space-y-4">
          {test.questions?.map((question, idx) => {
            const questionResult = result.results.find(r => r.questionId === String(question.id));
            const userAnswer = result.answers[String(question.id)];
            
            return (
              <div 
                key={question.id} 
                className={`p-4 rounded-lg border-2 ${
                  questionResult?.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Icon 
                    name={questionResult?.isCorrect ? 'CheckCircle' : 'XCircle'} 
                    size={20} 
                    className={questionResult?.isCorrect ? 'text-green-600 mt-1' : 'text-red-600 mt-1'} 
                  />
                  <div className="flex-1">
                    <div className="font-semibold mb-2">
                      Вопрос {idx + 1}: {question.question}
                    </div>
                    
                    {question.imageUrl && (
                      <img 
                        src={question.imageUrl} 
                        alt="Вопрос" 
                        className="w-full max-h-48 object-contain rounded-lg mb-3"
                      />
                    )}
                    
                    <div className="text-sm space-y-2">
                      {question.type === 'single' && (
                        <>
                          <div>
                            <span className="font-medium">Ваш ответ: </span>
                            <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {question.options?.[userAnswer as number]}
                            </span>
                          </div>
                          {!questionResult?.isCorrect && question.correctAnswer !== undefined && (
                            <div>
                              <span className="font-medium">Правильный ответ: </span>
                              <span className="text-green-700">
                                {question.options?.[question.correctAnswer as number]}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {question.type === 'multiple' && (
                        <>
                          <div>
                            <span className="font-medium">Ваши ответы: </span>
                            <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {Array.isArray(userAnswer) 
                                ? userAnswer.map((idx: number) => question.options?.[idx]).join(', ')
                                : 'Не отвечено'
                              }
                            </span>
                          </div>
                          {!questionResult?.isCorrect && Array.isArray(question.correctAnswer) && (
                            <div>
                              <span className="font-medium">Правильные ответы: </span>
                              <span className="text-green-700">
                                {question.correctAnswer.map((idx: number) => question.options?.[idx]).join(', ')}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {question.type === 'text' && (
                        <>
                          <div>
                            <span className="font-medium">Ваш ответ: </span>
                            <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {userAnswer as string || 'Не отвечено'}
                            </span>
                          </div>
                          {!questionResult?.isCorrect && question.correctAnswer && (
                            <div>
                              <span className="font-medium">Правильный ответ: </span>
                              <span className="text-green-700">{question.correctAnswer as string}</span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {question.type === 'matching' && (
                        <>
                          <div>
                            <span className="font-medium">Ваш порядок: </span>
                            <div className={`mt-1 ${questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {Array.isArray(userAnswer) 
                                ? userAnswer.map((item, i) => (
                                    <div key={i}>
                                      {question.matchingPairs?.[i]?.left} → {item}
                                    </div>
                                  ))
                                : 'Не отвечено'
                              }
                            </div>
                          </div>
                          {!questionResult?.isCorrect && question.matchingPairs && (
                            <div>
                              <span className="font-medium">Правильный порядок: </span>
                              <div className="text-green-700 mt-1">
                                {question.matchingPairs.map((pair, i) => (
                                  <div key={i}>
                                    {pair.left} → {pair.right}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm font-medium">
                      Баллы: {questionResult?.points || 0} / {question.points}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
