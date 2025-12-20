import json
import os
import psycopg2
import jwt
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

class RecordAttemptRequest(BaseModel):
    lessonId: str = Field(..., min_length=1)
    courseId: int = Field(..., ge=1)
    testId: int = Field(..., ge=1)
    score: int = Field(..., ge=0, le=100)
    passed: bool

def get_db_connection():
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        return None

def require_auth(headers: Dict[str, Any]) -> tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not auth_token:
        return None, {'statusCode': 401, 'error': 'Токен отсутствует'}
    
    payload = verify_jwt_token(auth_token)
    if not payload:
        return None, {'statusCode': 401, 'error': 'Недействительный токен'}
    
    return payload, None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для работы с попытками тестов:
    GET ?lessonId=x - получить информацию о попытках теста
    POST ?action=record - записать результат попытки
    POST ?action=start - начать новую попытку (уменьшить счетчик)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {}) or {}
    action = query_params.get('action', '')
    
    payload, auth_error = require_auth(headers)
    if auth_error:
        return {
            'statusCode': auth_error['statusCode'],
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': auth_error['error']}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    user_id = int(payload['user_id'])
    conn = get_db_connection()
    cur = conn.cursor()
    
    if method == 'GET':
        lesson_id = query_params.get('lessonId')
        if not lesson_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'lessonId обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Получаем информацию об уроке (тесте) и его максимальном количестве попыток
        cur.execute(
            "SELECT l.test_id, l.course_id, t.attempts_allowed FROM lessons_v2 l "
            "LEFT JOIN tests_v2 t ON l.test_id = t.id WHERE l.id = %s",
            (lesson_id,)
        )
        lesson_data = cur.fetchone()
        
        if not lesson_data or not lesson_data[0]:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тест не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        test_id, course_id, max_attempts = lesson_data
        
        # Получаем информацию о попытках пользователя
        cur.execute(
            "SELECT attempts_used, max_attempts, best_score, last_attempt_at "
            "FROM test_attempts_v2 WHERE user_id = %s AND lesson_id = %s",
            (user_id, lesson_id)
        )
        attempts_data = cur.fetchone()
        
        if attempts_data:
            attempts_used, stored_max, best_score, last_attempt = attempts_data
            remaining_attempts = stored_max - attempts_used
        else:
            # Первый раз пользователь заходит на тест
            attempts_used = 0
            remaining_attempts = max_attempts if max_attempts else 999
            best_score = 0
            last_attempt = None
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'attemptsUsed': attempts_used,
                'remainingAttempts': remaining_attempts,
                'maxAttempts': max_attempts if max_attempts else None,
                'bestScore': best_score,
                'lastAttemptAt': last_attempt.isoformat() if last_attempt else None,
                'hasUnlimitedAttempts': max_attempts is None or max_attempts == 0
            }, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'start':
        body_data = json.loads(event.get('body', '{}'))
        lesson_id = body_data.get('lessonId')
        
        if not lesson_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'lessonId обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Получаем данные о тесте
        cur.execute(
            "SELECT l.test_id, l.course_id, t.attempts_allowed FROM lessons_v2 l "
            "LEFT JOIN tests_v2 t ON l.test_id = t.id WHERE l.id = %s",
            (lesson_id,)
        )
        lesson_data = cur.fetchone()
        
        if not lesson_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тест не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        test_id, course_id, max_attempts = lesson_data
        
        # Проверяем есть ли уже запись о попытках
        cur.execute(
            "SELECT attempts_used, max_attempts FROM test_attempts_v2 "
            "WHERE user_id = %s AND lesson_id = %s",
            (user_id, lesson_id)
        )
        existing = cur.fetchone()
        
        if existing:
            attempts_used, stored_max = existing
            # Проверяем не исчерпаны ли попытки
            if max_attempts and max_attempts > 0 and attempts_used >= max_attempts:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Исчерпаны все попытки', 'attemptsUsed': attempts_used, 'maxAttempts': max_attempts}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Увеличиваем счетчик попыток
            cur.execute(
                "UPDATE test_attempts_v2 SET attempts_used = attempts_used + 1, "
                "last_attempt_at = NOW() WHERE user_id = %s AND lesson_id = %s "
                "RETURNING attempts_used, max_attempts",
                (user_id, lesson_id)
            )
        else:
            # Создаем новую запись с первой попыткой
            cur.execute(
                "INSERT INTO test_attempts_v2 (user_id, test_id, lesson_id, course_id, "
                "attempts_used, max_attempts, created_at, last_attempt_at) "
                "VALUES (%s, %s, %s, %s, 1, %s, NOW(), NOW()) "
                "RETURNING attempts_used, max_attempts",
                (user_id, test_id, lesson_id, course_id, max_attempts if max_attempts else 0)
            )
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'attemptsUsed': result[0],
                'remainingAttempts': result[1] - result[0] if result[1] > 0 else 999,
                'maxAttempts': result[1] if result[1] > 0 else None
            }, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'record':
        body_data = json.loads(event.get('body', '{}'))
        
        try:
            record_req = RecordAttemptRequest(**body_data)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Обновляем лучший результат если новый результат лучше
        cur.execute(
            "UPDATE test_attempts_v2 SET best_score = GREATEST(best_score, %s), "
            "last_attempt_at = NOW() WHERE user_id = %s AND lesson_id = %s",
            (record_req.score, user_id, record_req.lessonId)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Неизвестное действие'}, ensure_ascii=False),
        'isBase64Encoded': False
    }
