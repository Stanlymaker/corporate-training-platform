import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'matching';
  question: string;
  answers?: Answer[];
  correctText?: string;
  points: number;
  matchingPairs?: { left: string; right: string }[];
  textCheckType?: 'manual' | 'automatic';
}

interface QuestionDialogProps {
  show: boolean;
  question: Question | null;
  onSave: () => void;
  onCancel: () => void;
  onQuestionChange: (field: keyof Question, value: any) => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (answerId: string) => void;
  onUpdateAnswer: (answerId: string, field: keyof Answer, value: string | boolean) => void;
}

export default function QuestionDialog({
  show,
  question,
  onSave,
  onCancel,
  onQuestionChange,
  onAddAnswer,
  onRemoveAnswer,
  onUpdateAnswer,
}: QuestionDialogProps) {
  if (!show || !question) return null;

  const hasCorrectAnswer = question.answers?.some(a => a.isCorrect) || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold">
            {question.id ? 'Редактировать вопрос' : 'Новый вопрос'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст вопроса *
            </label>
            <textarea
              value={question.question}
              onChange={(e) => onQuestionChange('question', e.target.value)}
              placeholder="Что такое React?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип вопроса
              </label>
              <select
                value={question.type}
                onChange={(e) => onQuestionChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="single">Один правильный ответ</option>
                <option value="multiple">Несколько правильных ответов</option>
                <option value="text">Текстовый ответ</option>
                <option value="matching">Сопоставление</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Баллы за вопрос
              </label>
              <input
                type="number"
                value={question.points}
                onChange={(e) => onQuestionChange('points', parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {question.type === 'text' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип проверки
              </label>
              <select
                value={question.textCheckType || 'automatic'}
                onChange={(e) => onQuestionChange('textCheckType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="automatic">Автоматическая проверка</option>
                <option value="manual">Ручная проверка</option>
              </select>
            </div>
          )}

          {question.type === 'matching' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Пары для сопоставления
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const pairs = question.matchingPairs || [];
                    onQuestionChange('matchingPairs', [...pairs, { left: '', right: '' }]);
                  }}
                >
                  <Icon name="Plus" size={14} className="mr-1" />
                  Добавить пару
                </Button>
              </div>

              <div className="space-y-3">
                {question.matchingPairs?.map((pair, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={pair.left}
                      onChange={(e) => {
                        const pairs = [...(question.matchingPairs || [])];
                        pairs[index].left = e.target.value;
                        onQuestionChange('matchingPairs', pairs);
                      }}
                      placeholder="Левая часть"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Icon name="ArrowRight" size={20} className="text-gray-400" />
                    <input
                      type="text"
                      value={pair.right}
                      onChange={(e) => {
                        const pairs = [...(question.matchingPairs || [])];
                        pairs[index].right = e.target.value;
                        onQuestionChange('matchingPairs', pairs);
                      }}
                      placeholder="Правая часть"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const pairs = [...(question.matchingPairs || [])];
                        pairs.splice(index, 1);
                        onQuestionChange('matchingPairs', pairs);
                      }}
                      disabled={(question.matchingPairs?.length || 0) <= 2}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                ))}
              </div>

              {(!question.matchingPairs || question.matchingPairs.length === 0) && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Добавьте минимум 2 пары для сопоставления
                </p>
              )}
            </div>
          ) : question.type !== 'text' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Варианты ответов
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddAnswer}
                >
                  <Icon name="Plus" size={14} className="mr-1" />
                  Добавить вариант
                </Button>
              </div>

              <div className="space-y-3">
                {question.answers?.map((answer) => (
                  <div key={answer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type={question.type === 'single' ? 'radio' : 'checkbox'}
                      name={question.type === 'single' ? 'correct-answer' : undefined}
                      checked={answer.isCorrect}
                      onChange={(e) => onUpdateAnswer(answer.id, 'isCorrect', e.target.checked)}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) => onUpdateAnswer(answer.id, 'text', e.target.value)}
                      placeholder="Введите текст ответа"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveAnswer(answer.id)}
                      disabled={(question.answers?.length || 0) <= 2}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                ))}
              </div>

              {question.answers && question.answers.length > 0 && !hasCorrectAnswer && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Отметьте правильный вариант ответа
                </p>
              )}
            </div>
          ) : question.type === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.textCheckType === 'manual' ? 'Описание ожидаемого ответа' : 'Правильный ответ (текст)'}
              </label>
              <input
                type="text"
                value={question.correctText || ''}
                onChange={(e) => onQuestionChange('correctText', e.target.value)}
                placeholder={question.textCheckType === 'manual' ? 'Что должен написать студент' : 'Введите правильный ответ'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {question.textCheckType === 'manual' 
                  ? 'Это описание для преподавателя. Ответ будет проверяться вручную.' 
                  : 'Ответ студента будет сравниваться с этим текстом (без учета регистра)'}
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            onClick={onSave}
            disabled={
              !question.question ||
              (question.type !== 'text' && !hasCorrectAnswer) ||
              (question.type === 'text' && !question.correctText)
            }
          >
            <Icon name="Save" className="mr-2" size={16} />
            Сохранить вопрос
          </Button>
        </div>
      </div>
    </div>
  );
}