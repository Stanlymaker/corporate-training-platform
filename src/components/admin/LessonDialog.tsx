import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import RichTextEditor from './RichTextEditor';
import MediaManager, { MediaFile } from './MediaManager';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: string;
  order: number;
}

interface LessonDialogProps {
  show: boolean;
  lesson: Lesson | null;
  onSave: () => void;
  onCancel: () => void;
  onLessonChange: (field: keyof Lesson, value: any) => void;
}

export default function LessonDialog({
  show,
  lesson,
  onSave,
  onCancel,
  onLessonChange,
}: LessonDialogProps) {
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [mediaInsertType, setMediaInsertType] = useState<'image' | 'video' | 'pdf'>('image');

  if (!show || !lesson) return null;

  const handleInsertMedia = (type: 'image' | 'video' | 'pdf') => {
    setMediaInsertType(type);
    setShowMediaManager(true);
  };

  const handleMediaSelect = (file: MediaFile) => {
    const currentContent = lesson.content || '';
    let insertText = '';

    switch (file.type) {
      case 'image':
        insertText = `\n![${file.name}](${file.url})\n`;
        break;
      case 'video':
        insertText = `\n[Видео: ${file.name}](${file.url})\n`;
        break;
      case 'pdf':
        insertText = `\n[PDF: ${file.name}](${file.url})\n`;
        break;
    }

    onLessonChange('content', currentContent + insertText);
    setShowMediaManager(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white z-10">
            <h3 className="text-xl font-bold">
              {lesson.id ? 'Редактировать урок' : 'Новый урок'}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название урока *
              </label>
              <input
                type="text"
                value={lesson.title}
                onChange={(e) => onLessonChange('title', e.target.value)}
                placeholder="Введение в React"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип урока
                </label>
                <select
                  value={lesson.type}
                  onChange={(e) => onLessonChange('type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="video">Видео</option>
                  <option value="text">Текст</option>
                  <option value="test">Тест</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Длительность (мин)
                </label>
                <input
                  type="number"
                  value={lesson.duration}
                  onChange={(e) => onLessonChange('duration', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {lesson.type === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL видео
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lesson.videoUrl || ''}
                    onChange={(e) => onLessonChange('videoUrl', e.target.value)}
                    placeholder="https://youtube.com/watch?v=... или https://vimeo.com/..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleInsertMedia('video')}
                  >
                    <Icon name="Video" size={16} className="mr-2" />
                    Выбрать из библиотеки
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Поддерживаются YouTube, Vimeo и прямые ссылки на видео
                </p>
              </div>
            )}

            {lesson.type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Содержание урока
                </label>
                <RichTextEditor
                  value={lesson.content || ''}
                  onChange={(value) => onLessonChange('content', value)}
                  onInsertImage={() => handleInsertMedia('image')}
                  onInsertVideo={() => handleInsertMedia('video')}
                  onInsertPDF={() => handleInsertMedia('pdf')}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Используйте Markdown для форматирования текста. Вы можете добавлять
                  изображения, видео и PDF-документы.
                </p>
              </div>
            )}

            {lesson.type === 'test' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID теста
                </label>
                <input
                  type="text"
                  value={lesson.testId || ''}
                  onChange={(e) => onLessonChange('testId', e.target.value)}
                  placeholder="test-123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Укажите ID теста из раздела "Тесты"
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
            <Button variant="outline" onClick={onCancel}>
              Отмена
            </Button>
            <Button onClick={onSave} disabled={!lesson.title}>
              <Icon name="Save" className="mr-2" size={16} />
              Сохранить урок
            </Button>
          </div>
        </div>
      </div>

      <MediaManager
        show={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        onSelect={handleMediaSelect}
        allowedTypes={[mediaInsertType]}
      />
    </>
  );
}
