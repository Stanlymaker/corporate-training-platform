import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { useNavigate } from 'react-router-dom';

interface TestEditorHeaderProps {
  isEditMode: boolean;
  formTitle: string;
  loading: boolean;
  hasQuestions: boolean;
  saveSuccess?: boolean;
  onSave: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export default function TestEditorHeader({
  isEditMode,
  formTitle,
  loading,
  hasQuestions,
  saveSuccess = false,
  onSave,
  onCopy,
  onDelete,
}: TestEditorHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <Button
          variant="ghost"
          className="mb-2"
          onClick={() => navigate(ROUTES.ADMIN.TESTS)}
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад к тестам
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Редактировать тест' : 'Создать новый тест'}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
            <Icon name="CheckCircle2" size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">Изменения сохранены</span>
          </div>
        )}
        {isEditMode && (
          <>
            <Button
              variant="outline"
              onClick={onCopy}
              disabled={loading}
            >
              <Icon name="Copy" className="mr-2" size={16} />
              Копировать
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={loading}
            >
              <Icon name="Trash2" className="mr-2" size={16} />
              Удалить
            </Button>
          </>
        )}
        <Button
          onClick={onSave}
          disabled={!formTitle || !hasQuestions || loading}
        >
          <Icon name="Save" className="mr-2" size={16} />
          {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать тест'}
        </Button>
      </div>
    </div>
  );
}