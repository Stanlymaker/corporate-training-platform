import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TestProgressResetDialogProps {
  isOpen: boolean;
  studentsCount: number;
  progressResetOption: 'keep' | 'reset';
  loading: boolean;
  linkedCourses: any[];
  onOptionChange: (option: 'keep' | 'reset') => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TestProgressResetDialog({
  isOpen,
  studentsCount,
  progressResetOption,
  loading,
  linkedCourses,
  onOptionChange,
  onConfirm,
  onCancel,
}: TestProgressResetDialogProps) {
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
              Тест проходят {studentsCount} {studentsCount === 1 ? 'студент' : studentsCount < 5 ? 'студента' : 'студентов'}
            </h3>
            
            {linkedCourses.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  Тест используется в курсах:
                </p>
                <ul className="space-y-1 mb-3">
                  {linkedCourses.map((course: any) => (
                    <li key={course.id} className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Icon name="BookOpen" size={14} className="text-orange-500" />
                      {course.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              Вы публикуете тест после редактирования. Выберите, что делать с результатами студентов:
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
                  <div className="font-medium text-gray-900">Сохранить результаты</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Подходит если вы исправляли опечатки, не меняли вопросы и ответы
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: progressResetOption === 'reset' ? '#f97316' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="resetOption"
                  value="reset"
                  checked={progressResetOption === 'reset'}
                  onChange={(e) => onOptionChange(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Сбросить все результаты теста</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Если вы меняли вопросы, правильные ответы или добавили новые вопросы
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
            {loading ? 'Публикация...' : 'Опубликовать тест'}
          </Button>
        </div>
      </div>
    </div>
  );
}
