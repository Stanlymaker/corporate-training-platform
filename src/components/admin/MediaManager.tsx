import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'pdf';
  size: string;
  uploadedAt: string;
}

interface MediaManagerProps {
  show: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile) => void;
  allowedTypes?: ('image' | 'video' | 'pdf')[];
}

const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    name: 'course-intro.jpg',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    type: 'image',
    size: '2.4 MB',
    uploadedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'marketing-strategy.jpg',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    type: 'image',
    size: '1.8 MB',
    uploadedAt: '2024-01-14',
  },
  {
    id: '3',
    name: 'business-plan-template.pdf',
    url: 'https://example.com/business-plan.pdf',
    type: 'pdf',
    size: '845 KB',
    uploadedAt: '2024-01-13',
  },
  {
    id: '4',
    name: 'intro-video.mp4',
    url: 'https://example.com/intro.mp4',
    type: 'video',
    size: '15.2 MB',
    uploadedAt: '2024-01-12',
  },
];

export default function MediaManager({
  show,
  onClose,
  onSelect,
  allowedTypes = ['image', 'video', 'pdf'],
}: MediaManagerProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'pdf'>('all');
  const [uploadUrl, setUploadUrl] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  if (!show) return null;

  const filteredFiles = mockMediaFiles.filter(
    (file) =>
      allowedTypes.includes(file.type) &&
      (selectedType === 'all' || file.type === selectedType)
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return 'Image';
      case 'video':
        return 'Video';
      case 'pdf':
        return 'FileText';
      default:
        return 'File';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'image':
        return 'Изображение';
      case 'video':
        return 'Видео';
      case 'pdf':
        return 'PDF';
      default:
        return type;
    }
  };

  const handleUpload = () => {
    if (uploadUrl) {
      const newFile: MediaFile = {
        id: Date.now().toString(),
        name: 'new-file',
        url: uploadUrl,
        type: 'image',
        size: 'Unknown',
        uploadedAt: new Date().toISOString().split('T')[0],
      };
      onSelect(newFile);
      setUploadUrl('');
      setShowUploadForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <h3 className="text-xl font-bold">Медиабиблиотека</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                Все файлы
              </Button>
              {allowedTypes.includes('image') && (
                <Button
                  variant={selectedType === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('image')}
                >
                  <Icon name="Image" size={14} className="mr-1" />
                  Изображения
                </Button>
              )}
              {allowedTypes.includes('video') && (
                <Button
                  variant={selectedType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('video')}
                >
                  <Icon name="Video" size={14} className="mr-1" />
                  Видео
                </Button>
              )}
              {allowedTypes.includes('pdf') && (
                <Button
                  variant={selectedType === 'pdf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('pdf')}
                >
                  <Icon name="FileText" size={14} className="mr-1" />
                  PDF
                </Button>
              )}
            </div>

            <Button onClick={() => setShowUploadForm(!showUploadForm)}>
              <Icon name="Upload" size={16} className="mr-2" />
              Загрузить файл
            </Button>
          </div>

          {showUploadForm && (
            <Card className="p-4 mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="Вставьте URL файла или загрузите..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={handleUpload} disabled={!uploadUrl}>
                  Добавить
                </Button>
              </div>
            </Card>
          )}

          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="Folder" size={48} className="mx-auto mb-4 opacity-30" />
              <p>Файлов пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
                  onClick={() => onSelect(file)}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                    {file.type === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon
                        name={getTypeIcon(file.type)}
                        size={48}
                        className="text-gray-400"
                      />
                    )}
                    <Badge className="absolute top-2 right-2 text-xs">
                      {getTypeBadge(file.type)}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm truncate mb-1">{file.name}</div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{file.size}</span>
                      <span>{file.uploadedAt}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}
