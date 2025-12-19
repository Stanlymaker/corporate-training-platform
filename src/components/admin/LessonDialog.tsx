import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { uploadImage } from '@/utils/uploadImage';
import { uploadFile } from '@/utils/uploadFile';
import LessonBasicFields from './lesson-dialog/LessonBasicFields';
import LessonTypeContent from './lesson-dialog/LessonTypeContent';
import LessonMaterials from './lesson-dialog/LessonMaterials';

interface LessonMaterial {
  id: number;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'video';
  url: string;
}

interface Lesson {
  id: number;
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
    
    try {
      let url: string;
      
      // Для изображений используем uploadImage (с сжатием)
      // Для документов и видео используем uploadFile (без сжатия)
      if (type === 'image') {
        url = await uploadImage(file);
      } else {
        url = await uploadFile(file);
      }
      
      if (type === 'video') {
        onLessonChange('videoUrl', url);
      } else if (type === 'image') {
        onLessonChange('imageUrl', url);
      } else if (type === 'material') {
        const newMaterial: LessonMaterial = {
          id: Date.now(),
          title: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 'doc',
          url: url,
        };
        const materials = lesson.materials || [];
        onLessonChange('materials', [...materials, newMaterial]);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Не удалось загрузить файл');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveMaterial = (materialId: string) => {
    const materials = lesson.materials?.filter(m => m.id !== materialId) || [];
    onLessonChange('materials', materials);
  };

  const handleAddLink = (title: string, url: string) => {
    const newMaterial: LessonMaterial = {
      id: Date.now(),
      title: title,
      type: 'link',
      url: url,
    };
    const materials = lesson.materials || [];
    onLessonChange('materials', [...materials, newMaterial]);
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
          <LessonBasicFields 
            lesson={lesson} 
            onLessonChange={onLessonChange} 
          />

          <LessonTypeContent 
            lesson={lesson} 
            tests={tests} 
            onLessonChange={onLessonChange} 
          />

          <LessonMaterials
            materials={lesson.materials || []}
            uploadingFile={uploadingFile}
            onFileUpload={handleFileUpload}
            onRemoveMaterial={handleRemoveMaterial}
            onAddLink={handleAddLink}
          />
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
