import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export async function uploadImage(file: File): Promise<string> {
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
          throw new Error('Ошибка загрузки изображения');
        }
        
        const data = await response.json();
        resolve(data.url);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}
