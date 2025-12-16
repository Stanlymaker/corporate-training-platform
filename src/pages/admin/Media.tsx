import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'pdf';
  size: string;
  uploadedAt: string;
}

const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    name: 'course-intro.jpg',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    type: 'image',
    size: '2.4 MB',
    uploadedAt: '15.01.2024',
  },
  {
    id: '2',
    name: 'marketing-strategy.jpg',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    type: 'image',
    size: '1.8 MB',
    uploadedAt: '14.01.2024',
  },
  {
    id: '3',
    name: 'business-analytics.jpg',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    type: 'image',
    size: '3.1 MB',
    uploadedAt: '13.01.2024',
  },
  {
    id: '4',
    name: 'business-plan-template.pdf',
    url: 'https://example.com/business-plan.pdf',
    type: 'pdf',
    size: '845 KB',
    uploadedAt: '12.01.2024',
  },
  {
    id: '5',
    name: 'intro-video.mp4',
    url: 'https://example.com/intro.mp4',
    type: 'video',
    size: '15.2 MB',
    uploadedAt: '11.01.2024',
  },
  {
    id: '6',
    name: 'financial-planning.pdf',
    url: 'https://example.com/financial.pdf',
    type: 'pdf',
    size: '1.2 MB',
    uploadedAt: '10.01.2024',
  },
];

export default function AdminMedia() {
  const [files, setFiles] = useState<MediaFile[]>(mockMediaFiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'pdf'>('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadName, setUploadName] = useState('');

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || file.type === selectedType;
    return matchesSearch && matchesType;
  });

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
    if (uploadUrl && uploadName) {
      const newFile: MediaFile = {
        id: Date.now().toString(),
        name: uploadName,
        url: uploadUrl,
        type: 'image',
        size: 'Unknown',
        uploadedAt: new Date().toLocaleDateString('ru-RU'),
      };
      setFiles([newFile, ...files]);
      setUploadUrl('');
      setUploadName('');
      setShowUploadForm(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить этот файл?')) {
      setFiles(files.filter((f) => f.id !== id));
    }
  };

  const totalSize = files.reduce((acc, file) => {
    const size = parseFloat(file.size);
    return acc + (file.size.includes('MB') ? size : size / 1024);
  }, 0);

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Медиабиблиотека</h1>
            <p className="text-gray-600">
              Управление изображениями, видео и документами
            </p>
          </div>
          <Button onClick={() => setShowUploadForm(!showUploadForm)}>
            <Icon name="Upload" className="mr-2" size={18} />
            Загрузить файл
          </Button>
        </div>

        {showUploadForm && (
          <Card className="border shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Загрузить новый файл</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название файла
                  </label>
                  <Input
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="example-image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL файла
                  </label>
                  <Input
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Отмена
                  </Button>
                  <Button onClick={handleUpload} disabled={!uploadUrl || !uploadName}>
                    Загрузить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon name="FolderOpen" className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{files.length}</div>
                  <div className="text-sm text-gray-600">Всего файлов</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="Image" className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {files.filter((f) => f.type === 'image').length}
                  </div>
                  <div className="text-sm text-gray-600">Изображений</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Icon name="Video" className="text-purple-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {files.filter((f) => f.type === 'video').length}
                  </div>
                  <div className="text-sm text-gray-600">Видео</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Icon name="HardDrive" className="text-orange-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalSize.toFixed(1)} MB
                  </div>
                  <div className="text-sm text-gray-600">Использовано</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Icon
                  name="Search"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Поиск по названию файла..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                >
                  Все
                </Button>
                <Button
                  variant={selectedType === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('image')}
                >
                  <Icon name="Image" size={14} className="mr-1" />
                  Фото
                </Button>
                <Button
                  variant={selectedType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('video')}
                >
                  <Icon name="Video" size={14} className="mr-1" />
                  Видео
                </Button>
                <Button
                  variant={selectedType === 'pdf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('pdf')}
                >
                  <Icon name="FileText" size={14} className="mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredFiles.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-12 text-center text-gray-500">
              <Icon name="Folder" size={48} className="mx-auto mb-4 opacity-30" />
              <p>Файлов не найдено</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
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
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Icon name="Trash2" size={14} className="mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate mb-1" title={file.name}>
                    {file.name}
                  </div>
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
    </AdminLayout>
  );
}
