import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ProgressResetDialogProps {
  isOpen: boolean;
  studentsCount: number;
  progressResetOption: 'keep' | 'reset_tests' | 'reset_all';
  loading: boolean;
  onOptionChange: (option: 'keep' | 'reset_tests' | 'reset_all') => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ProgressResetDialog({
  isOpen,
  studentsCount,
  progressResetOption,
  loading,
  onOptionChange,
  onConfirm,
  onCancel,
}: ProgressResetDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="Users" size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Курс проходят {studentsCount} {studentsCount === 1 ? 'студент' : studentsCount < 5 ? 'студента' : 'студентов'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Вы редактируете опубликованный курс. Выберите, что делать с прогрессом студентов:
            </p>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: progressResetOption === 'keep' ? '#f97316' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="resetOption"
                  value="keep"
                  checked={progressResetOption === 'keep'}
                  onChange={(e) => onOptionChange(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Сохранить весь прогресс</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Подходит если вы исправляли опечатки и мелкие правки
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: progressResetOption === 'reset_tests' ? '#f97316' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="resetOption"
                  value="reset_tests"
                  checked={progressResetOption === 'reset_tests'}
                  onChange={(e) => onOptionChange(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Сбросить только результаты тестов</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Если вы меняли вопросы или правильные ответы в тестах
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: progressResetOption === 'reset_all' ? '#f97316' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="resetOption"
                  value="reset_all"
                  checked={progressResetOption === 'reset_all'}
                  onChange={(e) => onOptionChange(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Полностью сбросить прогресс</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Если курс сильно изменился по структуре или содержанию
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить курс'}
          </Button>
        </div>
      </div>
    </div>
  );
}
