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

def escape_sql_string(value: str) -> str:
    return value.replace("'", "''")

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
        
        lesson_id_safe = escape_sql_string(str(lesson_id))
        
        # Получаем данные урока
        cur.execute(f"SELECT test_id, course_id FROM lessons_v2 WHERE id = '{lesson_id_safe}'")
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
        
        test_id, course_id = lesson_data
        
        # Получаем данные теста
        test_id_safe = escape_sql_string(str(test_id))
        cur.execute(f"SELECT attempts_allowed FROM tests_v2 WHERE id = '{test_id_safe}'")
        test_data = cur.fetchone()
        max_attempts = test_data[0] if test_data else None
        
        cur.execute(
            f"SELECT attempts_used, max_attempts, best_score, last_attempt_at "
            f"FROM t_p8600777_corporate_training_p.test_attempts_v2 WHERE user_id = {user_id} AND lesson_id = '{lesson_id_safe}'"
        )
        attempts_data = cur.fetchone()
        
        if attempts_data:
            attempts_used, stored_max, best_score, last_attempt = attempts_data
            remaining_attempts = stored_max - attempts_used
        else:
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
        
        lesson_id_safe = escape_sql_string(str(lesson_id))
        
        # Получаем данные урока
        cur.execute(f"SELECT test_id, course_id FROM lessons_v2 WHERE id = '{lesson_id_safe}'")
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
        
        test_id, course_id = lesson_data
        
        # Получаем данные теста
        test_id_safe = escape_sql_string(str(test_id))
        cur.execute(f"SELECT attempts_allowed FROM tests_v2 WHERE id = '{test_id_safe}'")
        test_data = cur.fetchone()
        max_attempts = test_data[0] if test_data else None
        
        cur.execute(
            f"SELECT attempts_used, max_attempts FROM test_attempts_v2 "
            f"WHERE user_id = {user_id} AND lesson_id = '{lesson_id_safe}'"
        )
        existing = cur.fetchone()
        
        if existing:
            attempts_used, stored_max = existing
            if max_attempts and max_attempts > 0 and attempts_used >= max_attempts:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Исчерпаны все попытки', 'attemptsUsed': attempts_used, 'maxAttempts': max_attempts}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE t_p8600777_corporate_training_p.test_attempts_v2 SET attempts_used = attempts_used + 1, "
                f"last_attempt_at = NOW() WHERE user_id = {user_id} AND lesson_id = '{lesson_id_safe}' "
                f"RETURNING attempts_used, max_attempts"
            )
        else:
            max_attempts_value = max_attempts if max_attempts else 0
            cur.execute(
                f"INSERT INTO t_p8600777_corporate_training_p.test_attempts_v2 (user_id, test_id, lesson_id, course_id, "
                f"attempts_used, max_attempts, created_at, last_attempt_at) "
                f"VALUES ({user_id}, {test_id}, '{lesson_id_safe}', {course_id}, 1, {max_attempts_value}, NOW(), NOW()) "
                f"RETURNING attempts_used, max_attempts"
            )
        
        conn.commit()
        result = cur.fetchone()
        
        if result:
            new_attempts_used, stored_max = result
            remaining = stored_max - new_attempts_used
        else:
            new_attempts_used = 1
            remaining = (max_attempts - 1) if max_attempts else 999
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'attemptsUsed': new_attempts_used,
                'remainingAttempts': remaining,
                'maxAttempts': max_attempts if max_attempts else None,
                'hasUnlimitedAttempts': max_attempts is None or max_attempts == 0
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
                'body': json.dumps({'error': f'Неверные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        lesson_id_safe = escape_sql_string(str(record_req.lessonId))
        
        cur.execute(
            f"SELECT attempts_used, best_score FROM test_attempts_v2 "
            f"WHERE user_id = {user_id} AND lesson_id = '{lesson_id_safe}'"
        )
        existing = cur.fetchone()
        
        if existing:
            current_attempts, current_best = existing
            new_best = max(current_best, record_req.score)
            
            cur.execute(
                f"UPDATE t_p8600777_corporate_training_p.test_attempts_v2 SET best_score = {new_best}, "
                f"last_attempt_at = NOW() WHERE user_id = {user_id} AND lesson_id = '{lesson_id_safe}'"
            )
        else:
            max_attempts_val = 0
            cur.execute(
                f"SELECT attempts_allowed FROM t_p8600777_corporate_training_p.tests_v2 WHERE id = {record_req.testId}"
            )
            test_data = cur.fetchone()
            if test_data and test_data[0]:
                max_attempts_val = test_data[0]
            
            cur.execute(
                f"INSERT INTO t_p8600777_corporate_training_p.test_attempts_v2 (user_id, test_id, lesson_id, course_id, "
                f"attempts_used, max_attempts, best_score, created_at, last_attempt_at) "
                f"VALUES ({user_id}, {record_req.testId}, '{lesson_id_safe}', {record_req.courseId}, "
                f"1, {max_attempts_val}, {record_req.score}, NOW(), NOW())"
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
        'body': json.dumps({'error': 'Неверный метод или action'}, ensure_ascii=False),
        'isBase64Encoded': False
    }