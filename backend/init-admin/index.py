import json
import os
import psycopg2
import bcrypt
from datetime import datetime
from typing import Dict, Any

def get_db_connection():
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Инициализация администратора: создает или обновляет пароль admin@example.com
    POST / - создать/обновить админа с паролем admin123
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        # Хардкодим админа
        email = 'admin@example.com'
        name = 'Admin'
        password = 'admin123'
        role = 'admin'
        
        # Генерируем правильный bcrypt хеш
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        now = datetime.utcnow()
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Проверяем существует ли пользователь
        cur.execute("SELECT id FROM users_v2 WHERE email = %s", (email,))
        existing_user = cur.fetchone()
        
        if existing_user:
            # Обновляем пароль существующего админа
            cur.execute(
                "UPDATE users_v2 SET password_hash = %s, updated_at = %s, is_active = true WHERE email = %s",
                (password_hash, now, email)
            )
            conn.commit()
            message = f'Пароль админа {email} обновлен'
        else:
            # Создаем нового админа
            cur.execute(
                "INSERT INTO users_v2 (email, name, password_hash, role, is_active, "
                "registration_date, last_active, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (email, name, password_hash, role, True, now, now, now, now)
            )
            conn.commit()
            message = f'Админ {email} создан'
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': message,
                'email': email,
                'password': password,
                'hash': password_hash
            }, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'}, ensure_ascii=False),
        'isBase64Encoded': False
    }
