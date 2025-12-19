import json
import os
import urllib.request
import base64
from typing import Dict, Any
from urllib.parse import unquote

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Прокси для скачивания файлов с CDN с правильными заголовками
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
        # Логируем URL для отладки
        print(f"Downloading file from: {file_url}")
        
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