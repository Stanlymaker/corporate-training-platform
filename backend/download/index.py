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
        
        # Пробуем скачать файл
        try:
            response = s3.get_object(Bucket='files', Key=file_key)
            file_data = response['Body'].read()
        except s3.exceptions.NoSuchKey:
            # Если файл не найден, попробуем альтернативные пути
            # Например, если в URL documents/, попробуем images/
            if file_key.startswith('documents/'):
                alt_key = file_key.replace('documents/', 'images/')
                print(f"File not found, trying alternative path: {alt_key}")
                response = s3.get_object(Bucket='files', Key=alt_key)
                file_data = response['Body'].read()
            elif file_key.startswith('images/'):
                alt_key = file_key.replace('images/', 'documents/')
                print(f"File not found, trying alternative path: {alt_key}")
                response = s3.get_object(Bucket='files', Key=alt_key)
                file_data = response['Body'].read()
            else:
                raise
        
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