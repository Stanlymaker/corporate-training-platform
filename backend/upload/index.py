import json
import os
import boto3
import base64
import uuid
from typing import Dict, Any
from pydantic import BaseModel, Field

class UploadRequest(BaseModel):
    file: str = Field(..., min_length=1)
    filename: str = Field(..., min_length=1)
    contentType: str = Field(default='image/jpeg')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Загрузка файлов в S3 хранилище
    POST - загрузить файл (base64 в теле запроса)
    Возвращает CDN URL загруженного файла
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не разрешен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        upload_req = UploadRequest(**body_data)
        
        # Инициализация S3 клиента
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        
        # Декодируем base64
        file_data = base64.b64decode(upload_req.file)
        
        # Генерируем уникальное имя файла
        file_ext = upload_req.filename.split('.')[-1] if '.' in upload_req.filename else 'jpg'
        unique_filename = f"images/{uuid.uuid4()}.{file_ext}"
        
        # Загружаем в S3
        s3.put_object(
            Bucket='files',
            Key=unique_filename,
            Body=file_data,
            ContentType=upload_req.contentType
        )
        
        # Формируем CDN URL
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'url': cdn_url}, ensure_ascii=False),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка загрузки: {str(e)}'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
