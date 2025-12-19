import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

// Сжимает изображение до максимального размера
async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Максимальная ширина/высота 1920px
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Не удалось создать canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Пробуем разные уровни качества пока не достигнем нужного размера
        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Не удалось сжать изображение'));
                return;
              }
              
              const sizeMB = blob.size / 1024 / 1024;
              
              // Если размер больше maxSizeMB и качество можно еще снизить
              if (sizeMB > maxSizeMB && quality > 0.5) {
                quality -= 0.1;
                tryCompress();
              } else {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<string> {
  // Сжимаем изображение перед загрузкой
  const compressedFile = await compressImage(file, 1); // макс 1MB
  
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
            filename: compressedFile.name,
            contentType: compressedFile.type,
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
    reader.readAsDataURL(compressedFile);
  });
}