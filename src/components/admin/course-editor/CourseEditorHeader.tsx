import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';

interface CourseEditorHeaderProps {
  isEditMode: boolean;
  courseTitle: string;
  hasLessons: boolean;
  loading: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export default function CourseEditorHeader({
  isEditMode,
  courseTitle,
  hasLessons,
  loading,
  onSave,
  onDelete,
}: CourseEditorHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <Button
          variant="ghost"
          className="mb-2"
          onClick={() => navigate(ROUTES.ADMIN.COURSES)}
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад к курсам
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Редактировать курс' : 'Создать новый курс'}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onSave}
          disabled={!courseTitle || !hasLessons || loading}
        >
          <Icon name="Save" className="mr-2" size={16} />
          {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать курс'}
        </Button>
        
        {isEditMode && (
          <Button
            variant="outline"
            onClick={onDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}