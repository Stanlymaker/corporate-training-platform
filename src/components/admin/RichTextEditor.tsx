import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onInsertImage: () => void;
  onInsertVideo: () => void;
  onInsertPDF: () => void;
}

export default function RichTextEditor({
  value,
  onChange,
  onInsertImage,
  onInsertVideo,
  onInsertPDF,
}: RichTextEditorProps) {
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setSelectionStart(target.selectionStart);
    setSelectionEnd(target.selectionEnd);
  };

  const insertText = (before: string, after: string = '') => {
    const newValue =
      value.substring(0, selectionStart) +
      before +
      value.substring(selectionStart, selectionEnd) +
      after +
      value.substring(selectionEnd);
    onChange(newValue);
  };

  const wrapSelection = (wrapper: string) => {
    const selectedText = value.substring(selectionStart, selectionEnd);
    const newValue =
      value.substring(0, selectionStart) +
      wrapper +
      selectedText +
      wrapper +
      value.substring(selectionEnd);
    onChange(newValue);
  };

  const insertHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertText(prefix);
  };

  const insertList = (ordered: boolean) => {
    const prefix = ordered ? '1. ' : '- ';
    insertText('\n' + prefix);
  };

  const insertLink = () => {
    const url = prompt('Введите URL ссылки:');
    if (url) {
      const text = value.substring(selectionStart, selectionEnd) || 'Ссылка';
      const newValue =
        value.substring(0, selectionStart) +
        `[${text}](${url})` +
        value.substring(selectionEnd);
      onChange(newValue);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(1)}
            title="Заголовок 1"
            className="h-8 w-8 p-0"
          >
            <span className="font-bold">H1</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(2)}
            title="Заголовок 2"
            className="h-8 w-8 p-0"
          >
            <span className="font-bold">H2</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(3)}
            title="Заголовок 3"
            className="h-8 w-8 p-0"
          >
            <span className="font-bold">H3</span>
          </Button>
        </div>

        <div className="flex gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('**')}
            title="Жирный"
            className="h-8 w-8 p-0"
          >
            <Icon name="Bold" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('*')}
            title="Курсив"
            className="h-8 w-8 p-0"
          >
            <Icon name="Italic" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('`')}
            title="Код"
            className="h-8 w-8 p-0"
          >
            <Icon name="Code" size={16} />
          </Button>
        </div>

        <div className="flex gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertList(false)}
            title="Маркированный список"
            className="h-8 w-8 p-0"
          >
            <Icon name="List" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertList(true)}
            title="Нумерованный список"
            className="h-8 w-8 p-0"
          >
            <Icon name="ListOrdered" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            title="Вставить ссылку"
            className="h-8 w-8 p-0"
          >
            <Icon name="Link" size={16} />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onInsertImage}
            title="Вставить изображение"
            className="h-8 w-8 p-0"
          >
            <Icon name="Image" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onInsertVideo}
            title="Вставить видео"
            className="h-8 w-8 p-0"
          >
            <Icon name="Video" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onInsertPDF}
            title="Вставить PDF"
            className="h-8 w-8 p-0"
          >
            <Icon name="FileText" size={16} />
          </Button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelectionChange}
        placeholder="Начните вводить текст урока... Поддерживается Markdown форматирование"
        rows={15}
        className="w-full px-4 py-3 focus:outline-none resize-none font-mono text-sm"
      />

      <div className="bg-gray-50 border-t border-gray-300 p-2 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Поддержка Markdown</span>
          <span className="text-gray-400">|</span>
          <span>**жирный**</span>
          <span>*курсив*</span>
          <span>`код`</span>
          <span>[ссылка](url)</span>
        </div>
      </div>
    </div>
  );
}
