import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface TestFormData {
  title: string;
  description: string;
  courseId: string;
  passingScore: number;
  timeLimit: number;
}

interface TestInfoFormProps {
  formData: TestFormData;
  onInputChange: (field: keyof TestFormData, value: string | number) => void;
}

export default function TestInfoForm({ formData, onInputChange }: TestInfoFormProps) {
  return (
    <Card className="col-span-2 p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="ClipboardList" size={20} />
        Основная информация
      </h2>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Привязка к курсу *
          </label>
          <select
            value={formData.courseId}
            onChange={(e) => onInputChange('courseId', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Выберите курс</option>
            <option value="1">React для начинающих</option>
            <option value="2">Python и Django</option>
            <option value="3">UI/UX дизайн в Figma</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Этот тест будет доступен в выбранном курсе
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Проходной балл (%)
            </label>
            <input
              type="number"
              value={formData.passingScore}
              onChange={(e) => onInputChange('passingScore', parseInt(e.target.value) || 0)}
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
        </div>
      </div>
    </Card>
  );
}
