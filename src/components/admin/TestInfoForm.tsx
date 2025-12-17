import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface TestFormData {
  title: string;
  description: string;
  passScore: number;
  timeLimit: number;
  attempts: number;
  status: 'draft' | 'published';
  isFinal: boolean;
  requiresAllLessons?: boolean;
  requiresAllTests?: boolean;
}

interface TestInfoFormProps {
  formData: TestFormData;
  onInputChange: (field: keyof TestFormData, value: string | number) => void;
}

export default function TestInfoForm({ formData, onInputChange }: TestInfoFormProps) {
  return (
    <Card className="col-span-2 p-6 border-0 shadow-md">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="ClipboardList" size={20} />
        Основная информация
      </h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
          <p className="text-xs text-blue-700">
            Тест создается независимо от курсов. После создания вы сможете привязать его к любому курсу через редактор курса.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название теста *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Тест: Основы React"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Проверьте свои знания основ React"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Проходной балл (%)
            </label>
            <input
              type="number"
              value={formData.passScore}
              onChange={(e) => onInputChange('passScore', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Время на тест (мин)
            </label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => onInputChange('timeLimit', parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Кол-во попыток
            </label>
            <input
              type="number"
              value={formData.attempts}
              onChange={(e) => onInputChange('attempts', parseInt(e.target.value) || 0)}
              min="1"
              max="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={formData.status}
            onChange={(e) => onInputChange('status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFinal}
              onChange={(e) => onInputChange('isFinal', e.target.checked)}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Итоговый тест курса
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Итоговый тест открывается только после прохождения всех уроков и тестов
          </p>

          {formData.isFinal && (
            <div className="mt-3 ml-6 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresAllLessons}
                  onChange={(e) => onInputChange('requiresAllLessons', e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">
                  Требуется пройти все уроки
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresAllTests}
                  onChange={(e) => onInputChange('requiresAllTests', e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">
                  Требуется пройти все тесты к урокам
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}