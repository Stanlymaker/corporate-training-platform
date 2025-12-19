import json
import os
import urllib.request
from typing import Dict, Any
from urllib.parse import unquote

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Прокси для скачивания файлов с CDN с правильными заголовками
    Args: event - dict с httpMethod, queryStringParameters (url, filename)
    Returns: HTTP response с файлом
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
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    file_url = params.get('url')
    filename = params.get('filename', 'download')
    
    if not file_url:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'URL parameter required'})
        }
    
    try:
        # Скачиваем файл с CDN
        with urllib.request.urlopen(file_url) as response:
            file_data = response.read()
        
        # Определяем content-type по расширению
        content_type = 'application/octet-stream'
        if filename.endswith('.pdf'):
            content_type = 'application/pdf'
        elif filename.endswith('.docx'):
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif filename.endswith('.doc'):
            content_type = 'application/msword'
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': content_type,
                'Content-Disposition': f'attachment; filename="{filename}"',
                'Access-Control-Allow-Origin': '*'
            },
            'body': file_data.decode('latin-1'),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to download file: {str(e)}'})
        }
