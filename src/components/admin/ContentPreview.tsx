import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

interface ContentPreviewProps {
  content: string;
  title: string;
}

export default function ContentPreview({ content, title }: ContentPreviewProps) {
  const [isPreview, setIsPreview] = useState(false);

  const renderMarkdown = (text: string) => {
    let html = text;

    html = html.replace(/### (.*?)(\n|$)/g, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(/## (.*?)(\n|$)/g, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/# (.*?)(\n|$)/g, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/80" target="_blank">$1</a>');

    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />');

    html = html.replace(/^\- (.+)$/gm, '<li class="ml-6">$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6">$2</li>');

    html = html.replace(/\n\n/g, '</p><p class="mb-4">');
    html = '<p class="mb-4">' + html + '</p>';

    return html;
  };

  if (!isPreview) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Eye" size={20} className="text-blue-600" />
            <span className="font-medium text-blue-900">
              Предварительный просмотр доступен
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsPreview(true)}>
            <Icon name="Eye" size={14} className="mr-2" />
            Показать превью
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Icon name="Eye" size={20} />
          Предварительный просмотр
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setIsPreview(false)}>
          <Icon name="X" size={16} />
        </Button>
      </div>

      <div className="prose max-w-none">
        <h2 className="text-2xl font-bold mb-4">{title || 'Без названия'}</h2>
        <div
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      </div>

      {!content && (
        <div className="text-center py-12 text-gray-400">
          <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-30" />
          <p>Контент пока не добавлен</p>
        </div>
      )}
    </Card>
  );
}
