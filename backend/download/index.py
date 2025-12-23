import json
import os
import boto3
import base64
from typing import Dict, Any
from urllib.parse import unquote, urlparse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Прокси для скачивания файлов из S3 хранилища
    Args: event - dict с httpMethod, queryStringParameters (url, filename)
    Returns: HTTP response с файлом в base64
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}
    file_url = params.get('url')
    filename = params.get('filename', 'download')
    
    if not file_url:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'URL parameter required'}),
            'isBase64Encoded': False
        }
    
    try:
        # Инициализация S3 клиента
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        
        # Извлекаем путь к файлу из URL
        # URL формат: https://cdn.poehali.dev/projects/{project_id}/bucket/{path}
        parsed = urlparse(file_url)
        path_parts = parsed.path.split('/bucket/')
        if len(path_parts) < 2:
            raise ValueError(f'Invalid URL format: {file_url}')
        
        file_key = path_parts[1]  # Например: images/uuid.pdf или documents/uuid.pdf
        
        print(f"Attempting to download from S3: {file_key}")
        
        # Список возможных путей для поиска файла
        possible_keys = [file_key]
        
        # Добавляем альтернативные пути
        if file_key.startswith('documents/'):
            possible_keys.append(file_key.replace('documents/', 'images/'))
            possible_keys.append(file_key.replace('documents/', ''))
        elif file_key.startswith('images/'):
            possible_keys.append(file_key.replace('images/', 'documents/'))
            possible_keys.append(file_key.replace('images/', ''))
        else:
            possible_keys.append(f'images/{file_key}')
            possible_keys.append(f'documents/{file_key}')
        
        # Пробуем найти файл по одному из путей
        file_data = None
        last_error = None
        
        for key in possible_keys:
            try:
                print(f"Trying S3 key: {key}")
                response = s3.get_object(Bucket='files', Key=key)
                file_data = response['Body'].read()
                print(f"Successfully found file at: {key}")
                break
            except Exception as e:
                last_error = e
                continue
        
        if file_data is None:
            raise Exception(f"File not found in any location. Last error: {str(last_error)}")
        
        # Определяем content-type по расширению
        content_type = 'application/octet-stream'
        if filename.endswith('.pdf'):
            content_type = 'application/pdf'
        elif filename.endswith('.docx'):
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif filename.endswith('.doc'):
            content_type = 'application/msword'
        
        # Кодируем в base64
        file_base64 = base64.b64encode(file_data).decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': content_type,
                'Content-Disposition': f'attachment; filename="{filename}"',
                'Access-Control-Allow-Origin': '*'
            },
            'body': file_base64,
            'isBase64Encoded': True
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to download file: {str(e)}'}),
            'isBase64Encoded': False
        }