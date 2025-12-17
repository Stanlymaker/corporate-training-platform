import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import RichTextEditor from './RichTextEditor';
import { mockTests } from '@/data/mockData';

interface LessonMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'video';
  url: string;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: string;
  order: number;
  description?: string;
  materials?: LessonMaterial[];
  requiresPrevious?: boolean;
  imageUrl?: string;
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showMaterialMenu, setShowMaterialMenu] = useState(false);

  if (!show || !lesson) return null;

  const handleFileUpload = async (file: File, type: 'video' | 'image' | 'material') => {
    setUploadingFile(true);
    
    const fakeUrl = URL.createObjectURL(file);
    
    setTimeout(() => {
      if (type === 'video') {
        onLessonChange('videoUrl', fakeUrl);
      } else if (type === 'image') {
        onLessonChange('imageUrl', fakeUrl);
      } else if (type === 'material') {
        const newMaterial: LessonMaterial = {
          id: Date.now().toString(),
          title: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 'doc',
          url: fakeUrl,
        };
        const materials = lesson.materials || [];
        onLessonChange('materials', [...materials, newMaterial]);
      }
      setUploadingFile(false);
    }, 500);
  };

  const handleRemoveMaterial = (materialId: string) => {
    const materials = lesson.materials?.filter(m => m.id !== materialId) || [];
    onLessonChange('materials', materials);
  };

  const handleAddLink = () => {
    const url = prompt('Введите URL ссылки:');
    const title = prompt('Введите название ссылки:');
    if (url && title) {
      const newMaterial: LessonMaterial = {
        id: Date.now().toString(),
        title,
        type: 'link',
        url,
      };
      const materials = lesson.materials || [];
      onLessonChange('materials', [...materials, newMaterial]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold">
            {lesson.id ? 'Редактировать урок' : 'Новый урок'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Краткое описание
            </label>
            <textarea
              value={lesson.description || ''}
              onChange={(e) => onLessonChange('description', e.target.value)}
              placeholder="О чем этот урок..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lesson.requiresPrevious || false}
                onChange={(e) => onLessonChange('requiresPrevious', e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                Урок обязателен к прохождению для открытия следующих уроков
              </span>
            </label>
          </div>

          {lesson.type === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Видео урока
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {lesson.videoUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Icon name="CheckCircle" size={20} />
                        <span className="text-sm font-medium">Видео загружено</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onLessonChange('videoUrl', '')}
                      >
                        Заменить видео
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Icon name="Upload" size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Загрузите видеофайл или вставьте ссылку</p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'video');
                        }}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Icon name="Upload" size={14} className="mr-2" />
                            Загрузить файл
                          </span>
                        </Button>
                      </label>
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="или вставьте ссылку VK/Rutube"
                          onChange={(e) => onLessonChange('videoUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {lesson.type === 'text' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Содержание урока
                </label>
                <RichTextEditor
                  value={lesson.content || ''}
                  onChange={(value) => onLessonChange('content', value)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Используйте Markdown для форматирования текста
                </p>
              </div>
            </>
          )}

          {lesson.type === 'test' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите тест
              </label>
              <select
                value={lesson.testId || ''}
                onChange={(e) => onLessonChange('testId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Выберите тест --</option>
                {mockTests.filter(t => !t.isFinal).map(test => (
                  <option key={test.id} value={test.id}>
                    {test.title} ({test.questionsCount} вопросов)
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Отображаются только тесты к урокам (не итоговые)
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Справочные материалы
              </label>
              <div className="relative">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowMaterialMenu(!showMaterialMenu)}
                  disabled={uploadingFile}
                >
                  <Icon name="Plus" size={14} className="mr-1" />
                  Добавить
                </Button>
                
                {showMaterialMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'material');
                          setShowMaterialMenu(false);
                        }
                      }}
                      className="hidden"
                      id="material-upload"
                    />
                    <label htmlFor="material-upload">
                      <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 rounded-t-lg">
                        <Icon name="Paperclip" size={14} className="text-gray-600" />
                        <span className="text-sm">Файл</span>
                      </div>
                    </label>
                    <div 
                      onClick={() => {
                        handleAddLink();
                        setShowMaterialMenu(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 rounded-b-lg"
                    >
                      <Icon name="Link" size={14} className="text-gray-600" />
                      <span className="text-sm">Ссылка</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {lesson.materials && lesson.materials.length > 0 ? (
              <div className="space-y-2">
                {lesson.materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon 
                        name={material.type === 'pdf' ? 'FileText' : material.type === 'link' ? 'Link' : 'File'} 
                        size={16} 
                        className="text-gray-400"
                      />
                      <span className="text-sm font-medium">{material.title}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMaterial(material.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-3">
                Нет прикрепленных материалов
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={!lesson.title || uploadingFile}>
            <Icon name="Save" className="mr-2" size={16} />
            Сохранить урок
          </Button>
        </div>
      </div>
    </div>
  );
}