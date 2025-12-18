import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import RichTextEditor from './RichTextEditor';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

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
  testId?: number;
  isFinalTest?: boolean;
  finalTestRequiresAllLessons?: boolean;
  finalTestRequiresAllTests?: boolean;
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
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialType, setMaterialType] = useState<'file' | 'link'>('file');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    if (show && lesson?.type === 'test') {
      loadTests();
    }
  }, [show, lesson?.type]);

  const loadTests = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TESTS, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

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
    if (linkUrl && linkTitle) {
      const newMaterial: LessonMaterial = {
        id: Date.now().toString(),
        title: linkTitle,
        type: 'link',
        url: linkUrl,
      };
      const materials = lesson.materials || [];
      onLessonChange('materials', [...materials, newMaterial]);
      setLinkTitle('');
      setLinkUrl('');
      setShowMaterialForm(false);
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
                  Ссылка на видео *
                </label>
                <input
                  type="url"
                  value={lesson.videoUrl || ''}
                  onChange={(e) => onLessonChange('videoUrl', e.target.value)}
                  placeholder="https://vk.com/video... или https://rutube.ru/video/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Поддерживаются ссылки VK Видео и Rutube
                </p>
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
            <div className="space-y-4">
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
                  {tests.map(test => (
                    <option key={test.id} value={test.id} disabled={test.status === 'draft'}>
                      {test.title} {test.status === 'draft' ? '(Черновик - недоступен)' : `(${test.questionsCount} вопросов, ${test.timeLimit} мин)`}
                    </option>
                  ))}
                </select>
                {lesson.testId && tests.find(t => t.id === lesson.testId)?.status === 'draft' && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Icon name="AlertTriangle" size={16} />
                      Выбранный тест находится в статусе "Черновик". Опубликуйте тест перед публикацией курса.
                    </p>
                  </div>
                )}
              </div>

              {lesson.testId && (
                <div className="border-t pt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lesson.isFinalTest || false}
                      onChange={(e) => onLessonChange('isFinalTest', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Итоговый тест курса
                    </span>
                  </label>

                  {lesson.isFinalTest && (
                    <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Условия доступа к итоговому тесту:</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lesson.finalTestRequiresAllLessons || false}
                          onChange={(e) => onLessonChange('finalTestRequiresAllLessons', e.target.checked)}
                          className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">
                          Требуется пройти все уроки курса
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lesson.finalTestRequiresAllTests || false}
                          onChange={(e) => onLessonChange('finalTestRequiresAllTests', e.target.checked)}
                          className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">
                          Требуется пройти все тесты к урокам
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Справочные материалы
              </label>
              {!showMaterialForm && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowMaterialForm(true)}
                  disabled={uploadingFile}
                >
                  <Icon name="Plus" size={14} className="mr-1" />
                  Добавить
                </Button>
              )}
            </div>

            {showMaterialForm && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={materialType === 'file'}
                        onChange={() => setMaterialType('file')}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-sm">Файл</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={materialType === 'link'}
                        onChange={() => setMaterialType('link')}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-sm">Ссылка</span>
                    </label>
                  </div>

                  {materialType === 'file' ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'material');
                            setShowMaterialForm(false);
                          }
                        }}
                        className="hidden"
                        id="material-upload-form"
                      />
                      <label htmlFor="material-upload-form">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-orange-500 transition-colors">
                          <Icon name="Upload" size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Нажмите для выбора файла</p>
                          <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX</p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Название ссылки"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMaterialForm(false);
                        setLinkTitle('');
                        setLinkUrl('');
                      }}
                    >
                      Отмена
                    </Button>
                    {materialType === 'link' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddLink}
                        disabled={!linkTitle || !linkUrl}
                      >
                        Добавить ссылку
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

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