import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TestResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  test: any;
  result: any;
  onClose: () => void;
}

export default function TestResultsDialog({
  open,
  onOpenChange,
  userName,
  test,
  result,
  onClose
}: TestResultsDialogProps) {
  if (!test || !result) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon name="FileText" size={24} className="text-blue-500" />
            Результаты тестирования — {userName}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-6 py-4">
          <div className={`p-6 rounded-lg border-2 ${
            result.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          }`}>
            <div className="text-center mb-4">
              <Icon 
                name={result.passed ? 'CheckCircle' : 'XCircle'} 
                size={48} 
                className={`mx-auto mb-3 ${result.passed ? 'text-green-500' : 'text-red-500'}`}
              />
              <h3 className="text-xl font-bold mb-2">
                {result.passed ? 'Тест пройден!' : 'Тест не пройден'}
              </h3>
              <p className="text-lg mb-1">
                Результат: <span className="font-bold">{result.score}%</span>
              </p>
              <p className="text-gray-600 mb-1">
                Баллы: <span className="font-semibold">{result.earnedPoints} из {result.totalPoints}</span>
              </p>
              <p className="text-gray-600 mb-2">
                Проходной балл: <span className="font-semibold">{test.passScore}%</span>
              </p>
              <p className="text-sm text-gray-500">
                Завершено: {new Date(result.completedAt).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon name="List" size={20} />
              Детальные результаты
            </h4>
            
            <div className="space-y-4">
              {test.questions?.map((question: any, idx: number) => {
                const questionResult = result.results.find((r: any) => r.questionId === String(question.id));
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
                    <div className="flex items-start gap-3">
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
                                <span className="font-medium">Ответ: </span>
                                <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                  {question.options?.[userAnswer as number]}
                                </span>
                              </div>
                              {!questionResult?.isCorrect && question.correctAnswer !== undefined && (
                                <div>
                                  <span className="font-medium">Правильный: </span>
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
                                <span className="font-medium">Ответы: </span>
                                <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                  {Array.isArray(userAnswer) 
                                    ? userAnswer.map((idx: number) => question.options?.[idx]).join(', ')
                                    : 'Не отвечено'
                                  }
                                </span>
                              </div>
                              {!questionResult?.isCorrect && Array.isArray(question.correctAnswer) && (
                                <div>
                                  <span className="font-medium">Правильные: </span>
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
                                <span className="font-medium">Ответ: </span>
                                <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                  {userAnswer as string || 'Не отвечено'}
                                </span>
                              </div>
                              {!questionResult?.isCorrect && question.correctAnswer && (
                                <div>
                                  <span className="font-medium">Правильный: </span>
                                  <span className="text-green-700">{question.correctAnswer as string}</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {question.type === 'matching' && (
                            <>
                              <div>
                                <span className="font-medium">Порядок: </span>
                                <div className={`mt-1 ${questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                  {Array.isArray(userAnswer) 
                                    ? userAnswer.map((item: any, i: number) => (
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
                                  <span className="font-medium">Правильный: </span>
                                  <div className="text-green-700 mt-1">
                                    {question.matchingPairs.map((pair: any, i: number) => (
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
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Закрыть
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
