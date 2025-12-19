import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ReactMarkdown from 'react-markdown';
import { Lesson } from './types';

interface LessonContentProps {
  lesson: Lesson;
  currentIndex: number;
  onDownload: (url: string, filename: string) => void;
  children?: React.ReactNode;
}

export default function LessonContent({ lesson, currentIndex, onDownload, children }: LessonContentProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              {currentIndex + 1}
            </div>
            <div>
              <div className="text-lg">{lesson.title}</div>
              {lesson.description && (
                <div className="text-sm text-gray-500 font-normal">{lesson.description}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon name="Clock" size={16} />
            <span>{lesson.duration} мин</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {lesson.type === 'video' && lesson.videoUrl && (
          <div className="mb-6 rounded-lg overflow-hidden bg-black relative w-full" style={{ paddingTop: '56.25%' }}>
            <div 
              className="absolute inset-0"
              dangerouslySetInnerHTML={{ 
                __html: lesson.videoUrl.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"')
              }}
            />
          </div>
        )}

        {children}

        <div className="prose prose-lg max-w-none">
          {lesson.type === 'text' && (
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          )}
          {lesson.type === 'video' && lesson.content && (
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          )}
        </div>

        {lesson.materials && lesson.materials.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-xl font-bold mb-4">Материалы урока</h3>
            <div className="space-y-2">
              {Array.from(new Map(lesson.materials.map(m => [m.id, m])).values()).map(material => (
                <button
                  key={material.id}
                  onClick={() => onDownload(material.url, material.title)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <Icon
                    name={material.type === 'pdf' ? 'FileText' : material.type === 'video' ? 'Video' : 'File'}
                    size={20}
                    className="text-primary"
                  />
                  <span className="font-medium">{material.title}</span>
                  <Icon name="Download" size={16} className="ml-auto text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
