import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface LessonMaterial {
  id: number;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'video';
  url: string;
}

interface LessonMaterialsProps {
  materials: LessonMaterial[];
  uploadingFile: boolean;
  onFileUpload: (file: File, type: 'material') => void;
  onRemoveMaterial: (materialId: string) => void;
  onAddLink: (title: string, url: string) => void;
}

export default function LessonMaterials({
  materials,
  uploadingFile,
  onFileUpload,
  onRemoveMaterial,
  onAddLink,
}: LessonMaterialsProps) {
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialType, setMaterialType] = useState<'file' | 'link'>('file');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const handleAddLink = () => {
    if (linkUrl && linkTitle) {
      onAddLink(linkTitle, linkUrl);
      setLinkTitle('');
      setLinkUrl('');
      setShowMaterialForm(false);
    }
  };

  const handleCancelForm = () => {
    setShowMaterialForm(false);
    setLinkTitle('');
    setLinkUrl('');
  };

  return (
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
                      onFileUpload(file, 'material');
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
                onClick={handleCancelForm}
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

      {materials && materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map((material) => (
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
                onClick={() => onRemoveMaterial(material.id)}
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
  );
}
