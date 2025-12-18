import json
import os
import psycopg2
import jwt
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

class CompleteLessonRequest(BaseModel):
    courseId: str = Field(..., min_length=1)
    lessonId: str = Field(..., min_length=1)

class SubmitTestRequest(BaseModel):
    courseId: str = Field(..., min_length=1)
    testId: str = Field(..., min_length=1)
    answers: Dict[str, Any]

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

def format_progress_response(progress_row: tuple) -> Dict[str, Any]:
    return {
        'courseId': progress_row[0],
        'userId': progress_row[1],
        'completedLessons': progress_row[2],
        'totalLessons': progress_row[3],
        'testScore': progress_row[4],
        'completed': progress_row[5],
        'completedLessonIds': progress_row[6] if progress_row[6] else [],
        'lastAccessedLesson': progress_row[7],
        'startedAt': progress_row[8].isoformat() if progress_row[8] else None,
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отслеживание прогресса обучения
    GET ?userId=x - прогресс пользователя по всем курсам
    GET ?userId=x&courseId=y - прогресс по конкретному курсу
    POST ?action=complete - отметить урок завершенным
    POST ?action=submit - отправить результаты теста
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
    user_id = query_params.get('userId')
    course_id = query_params.get('courseId')
    action = query_params.get('action', '')
    
    payload, auth_error = require_auth(headers)
    if auth_error:
        return {
            'statusCode': auth_error['statusCode'],
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': auth_error['error']}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if payload.get('role') != 'admin' and user_id != payload['user_id']:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Доступ запрещен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Если course_id - это display_id (число), преобразуем в UUID
    course_uuid = None
    if course_id:
        try:
            display_id = int(course_id)
            cur.execute("SELECT id FROM courses WHERE display_id = %s", (display_id,))
            course_row = cur.fetchone()
            if course_row:
                course_uuid = course_row[0]
            else:
                course_uuid = course_id  # Возможно это уже UUID
        except ValueError:
            course_uuid = course_id  # Это UUID
    
    if method == 'GET' and user_id and course_uuid:
        cur.execute(
            "SELECT course_id, user_id, completed_lessons, total_lessons, test_score, completed, "
            "completed_lesson_ids, last_accessed_lesson, started_at "
            "FROM course_progress WHERE user_id = %s AND course_id = %s",
            (user_id, course_uuid)
        )
        progress = cur.fetchone()
        
        if not progress:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Прогресс не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        progress_data = format_progress_response(progress)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'progress': progress_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET' and user_id:
        cur.execute(
            "SELECT course_id, user_id, completed_lessons, total_lessons, test_score, completed, "
            "completed_lesson_ids, last_accessed_lesson, started_at "
            "FROM course_progress WHERE user_id = %s ORDER BY started_at DESC",
            (user_id,)
        )
        progress_rows = cur.fetchall()
        progress_list = [format_progress_response(p) for p in progress_rows]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'progress': progress_list}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'start':
        body_data = json.loads(event.get('body', '{}'))
        start_req = CompleteLessonRequest(**body_data)
        
        # Проверяем, есть ли уже прогресс
        cur.execute(
            "SELECT course_id FROM course_progress WHERE user_id = %s AND course_id = %s",
            (payload['user_id'], start_req.courseId)
        )
        existing = cur.fetchone()
        
        if not existing:
            # Создаем новый прогресс
            cur.execute(
                "SELECT COUNT(*) FROM lessons WHERE course_id = %s",
                (start_req.courseId,)
            )
            total_lessons = cur.fetchone()[0]
            
            now = datetime.utcnow()
            cur.execute(
                "INSERT INTO course_progress (course_id, user_id, completed_lessons, total_lessons, "
                "test_score, completed, completed_lesson_ids, last_accessed_lesson, started_at, updated_at, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (start_req.courseId, payload['user_id'], 0, total_lessons, 0, False, 
                 json.dumps([]), start_req.lessonId, now, now, now)
            )
            conn.commit()
        else:
            # Обновляем последний урок
            cur.execute(
                "UPDATE course_progress SET last_accessed_lesson = %s, updated_at = %s "
                "WHERE user_id = %s AND course_id = %s",
                (start_req.lessonId, datetime.utcnow(), payload['user_id'], start_req.courseId)
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
    
    if method == 'POST' and action == 'complete':
        body_data = json.loads(event.get('body', '{}'))
        complete_req = CompleteLessonRequest(**body_data)
        
        # Сначала проверяем/создаем прогресс
        cur.execute(
            "SELECT completed_lesson_ids, total_lessons FROM course_progress WHERE user_id = %s AND course_id = %s",
            (payload['user_id'], complete_req.courseId)
        )
        progress = cur.fetchone()
        
        if not progress:
            # Создаем прогресс если его нет
            cur.execute(
                "SELECT COUNT(*) FROM lessons WHERE course_id = %s",
                (complete_req.courseId,)
            )
            total_lessons = cur.fetchone()[0]
            
            now = datetime.utcnow()
            completed_ids = [complete_req.lessonId]
            
            cur.execute(
                "INSERT INTO course_progress (course_id, user_id, completed_lessons, total_lessons, "
                "test_score, completed, completed_lesson_ids, last_accessed_lesson, started_at, updated_at, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (complete_req.courseId, payload['user_id'], 1, total_lessons, 0, False, 
                 json.dumps(completed_ids), complete_req.lessonId, now, now, now)
            )
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'completed': False}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        completed_ids = progress[0] if progress[0] else []
        total_lessons = progress[1]
        
        if complete_req.lessonId not in completed_ids:
            completed_ids.append(complete_req.lessonId)
            
            cur.execute(
                "UPDATE course_progress SET completed_lessons = %s, completed_lesson_ids = %s, "
                "last_accessed_lesson = %s, updated_at = %s WHERE user_id = %s AND course_id = %s",
                (len(completed_ids), json.dumps(completed_ids), complete_req.lessonId,
                 datetime.utcnow(), payload['user_id'], complete_req.courseId)
            )
            
            total = total_lessons
            
            if len(completed_ids) >= total:
                cur.execute(
                    "UPDATE course_progress SET completed = true, completed_at = %s WHERE user_id = %s AND course_id = %s",
                    (datetime.utcnow(), payload['user_id'], complete_req.courseId)
                )
                
                cur.execute(
                    "UPDATE course_assignments SET status = 'completed' WHERE user_id = %s AND course_id = %s",
                    (payload['user_id'], complete_req.courseId)
                )
            else:
                cur.execute(
                    "UPDATE course_assignments SET status = 'in_progress' WHERE user_id = %s AND course_id = %s",
                    (payload['user_id'], complete_req.courseId)
                )
            
            conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'alreadyCompleted': True}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'submit':
        body_data = json.loads(event.get('body', '{}'))
        submit_req = SubmitTestRequest(**body_data)
        
        cur.execute(
            "SELECT pass_score FROM tests WHERE id = %s",
            (submit_req.testId,)
        )
        test = cur.fetchone()
        
        if not test:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тест не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        pass_score = test[0]
        
        cur.execute(
            "SELECT id, correct_answer, points FROM questions WHERE test_id = %s",
            (submit_req.testId,)
        )
        questions = cur.fetchall()
        
        total_points = sum(q[2] for q in questions)
        earned_points = 0
        
        for question in questions:
            question_id = question[0]
            correct_answer = question[1]
            points = question[2]
            
            user_answer = submit_req.answers.get(question_id)
            
            if user_answer == correct_answer:
                earned_points += points
        
        score = int((earned_points / total_points * 100)) if total_points > 0 else 0
        passed = score >= pass_score
        
        new_result_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        cur.execute(
            "INSERT INTO test_results (id, user_id, course_id, test_id, score, answers, passed, completed_at, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (new_result_id, payload['user_id'], submit_req.courseId, submit_req.testId,
             score, json.dumps(submit_req.answers), passed, now, now)
        )
        
        cur.execute(
            "UPDATE course_progress SET test_score = %s, updated_at = %s WHERE user_id = %s AND course_id = %s",
            (score, now, payload['user_id'], submit_req.courseId)
        )
        
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'score': score, 'passed': passed, 'message': 'Тест завершен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Маршрут не найден'}, ensure_ascii=False),
        'isBase64Encoded': False
    }