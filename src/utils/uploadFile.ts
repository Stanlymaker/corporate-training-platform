import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

/**
 * Загружает любой файл (документ, изображение, видео) на сервер
 * @param file - Файл для загрузки
 * @returns Promise с URL загруженного файла
 */
export async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        
        const response = await fetch(API_ENDPOINTS.UPLOAD, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            file: base64,
            filename: file.name,
            contentType: file.type,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Ошибка загрузки файла');
        }
        
        const data = await response.json();
        resolve(data.url);
      } catch (error) {
        console.error('Upload error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}
