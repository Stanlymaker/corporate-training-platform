import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface TestFormData {
  title: string;
  description: string;
  passScore: number;
  timeLimit: number;
  attempts: number;
  status: 'draft' | 'published';
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
            Тест создается независимо от курсов. После создания вы сможете привязать его к урокам через редактор курса.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Icon name="Settings" size={16} className="text-orange-600" />
            Статус теста
          </label>
          <select
            value={formData.status}
            onChange={(e) => onInputChange('status', e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium text-gray-900"
          >
            <option value="draft">📝 Черновик</option>
            <option value="published">✅ Опубликован</option>
          </select>
          <p className="text-xs text-gray-600 mt-2">
            {formData.status === 'draft' 
              ? 'Тест виден только администраторам' 
              : 'Тест доступен для прохождения студентам'}
          </p>
        </div>

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
      </div>
    </Card>
  );
}