import json
import os
import psycopg2
import jwt
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

def log_action(conn, level: str, action: str, message: str, user_id: Optional[int] = None, 
               ip_address: Optional[str] = None, user_agent: Optional[str] = None, 
               details: Optional[Dict[str, Any]] = None) -> None:
    try:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO system_logs (level, action, message, user_id, ip_address, user_agent, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (level, action, message, user_id, ip_address, user_agent, json.dumps(details) if details else None))
            conn.commit()
    except Exception as e:
        print(f"[WARNING] Failed to create log: {e}")

class CompleteLessonRequest(BaseModel):
    courseId: int = Field(..., ge=1)
    lessonId: str = Field(..., min_length=1)

class SubmitTestRequest(BaseModel):
    courseId: int = Field(..., ge=1)
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
        'earnedRewards': progress_row[9] if len(progress_row) > 9 and progress_row[9] else [],
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отслеживание прогресса обучения
    GET ?userId=x - прогресс пользователя по всем курсам
    GET ?userId=x&courseId=y - прогресс по конкретному курсу
    POST ?action=complete - отметить урок завершенным
    POST ?action=submit - отправить результаты теста
    POST ?action=reset - сбросить прогресс по курсу (только админ)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    
    # Проверка доступа только для GET запросов с userId
    if method == 'GET' and user_id and payload.get('role') != 'admin' and int(user_id) != payload['user_id']:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Доступ запрещен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    course_id_int = int(course_id) if course_id else None
    
    if method == 'GET':
        # GET с userId и courseId - прогресс по конкретному курсу
        if user_id and course_id_int:
            cur.execute(
                "SELECT cp.course_id, cp.user_id, cp.completed_lessons, "
                "(SELECT COUNT(*) FROM lessons_v2 WHERE course_id = cp.course_id) as total_lessons, "
                "cp.test_score, cp.completed, "
                "cp.completed_lesson_ids, cp.last_accessed_lesson, cp.started_at, cp.earned_rewards "
                "FROM course_progress_v2 cp WHERE cp.user_id = %s AND cp.course_id = %s",
                (int(user_id), course_id_int)
            )
            progress = cur.fetchone()
            
            if not progress:
                cur.close()
                conn.close()
                # Возвращаем пустой массив, а не 404
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'progress': []}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Пересчитываем completed_lessons из массива
            completed_lesson_ids = progress[6] if progress[6] else []
            actual_completed = len(completed_lesson_ids)
            
            # Создаем кортеж с пересчитанными значениями
            progress_updated = (
                progress[0], # course_id
                progress[1], # user_id
                actual_completed, # completed_lessons (пересчитанное)
                progress[3], # total_lessons (из COUNT)
                progress[4], # test_score
                progress[5], # completed
                progress[6], # completed_lesson_ids
                progress[7], # last_accessed_lesson
                progress[8], # started_at
                progress[9] if len(progress) > 9 else [], # earned_rewards
            )
            
            progress_data = format_progress_response(progress_updated)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'progress': [progress_data]}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # GET с userId - весь прогресс пользователя
        if user_id:
            cur.execute(
                "SELECT cp.course_id, cp.user_id, cp.completed_lessons, "
                "(SELECT COUNT(*) FROM lessons_v2 WHERE course_id = cp.course_id) as total_lessons, "
                "cp.test_score, cp.completed, "
                "cp.completed_lesson_ids, cp.last_accessed_lesson, cp.started_at, cp.earned_rewards "
                "FROM course_progress_v2 cp WHERE cp.user_id = %s ORDER BY cp.started_at DESC",
                (int(user_id),)
            )
            progress_rows = cur.fetchall()
            
            # Пересчитываем для каждой записи
            progress_list = []
            for p in progress_rows:
                completed_lesson_ids = p[6] if p[6] else []
                actual_completed = len(completed_lesson_ids)
                
                progress_updated = (
                    p[0], # course_id
                    p[1], # user_id
                    actual_completed, # completed_lessons (пересчитанное)
                    p[3], # total_lessons (из COUNT)
                    p[4], # test_score
                    p[5], # completed
                    p[6], # completed_lesson_ids
                    p[7], # last_accessed_lesson
                    p[8], # started_at
                    p[9] if len(p) > 9 else [], # earned_rewards
                )
                progress_list.append(format_progress_response(progress_updated))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'progress': progress_list}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # GET без параметров - весь прогресс (только для админа)
        cur.execute(
            "SELECT course_id, user_id, completed_lessons, total_lessons, test_score, completed, "
            "completed_lesson_ids, last_accessed_lesson, started_at, earned_rewards "
            "FROM course_progress_v2 ORDER BY started_at DESC"
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
        
        course_id = start_req.courseId
        
        # Проверяем, есть ли уже прогресс
        cur.execute(
            "SELECT course_id FROM course_progress_v2 WHERE user_id = %s AND course_id = %s",
            (payload['user_id'], course_id)
        )
        existing = cur.fetchone()
        
        if not existing:
            # Проверяем тип доступа курса
            cur.execute(
                "SELECT access_type FROM courses_v2 WHERE id = %s",
                (course_id,)
            )
            course_data = cur.fetchone()
            
            if not course_data:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Курс не найден'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            access_type = course_data[0]
            
            # Для закрытых курсов проверяем назначение
            if access_type == 'closed':
                user_id_int = int(payload['user_id'])
                cur.execute(
                    "SELECT id FROM course_assignments_v2 WHERE course_id = %s AND user_id = %s",
                    (course_id, user_id_int)
                )
                if not cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Курс не назначен вам'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
            
            # Создаем прогресс
            now = datetime.utcnow()
            
            cur.execute(
                "INSERT INTO course_progress_v2 (course_id, user_id, completed_lessons, total_lessons, "
                "completed, started_at, created_at, updated_at) "
                "SELECT %s, %s, 0, lessons_count, false, %s, %s, %s FROM courses_v2 WHERE id = %s",
                (course_id, int(payload['user_id']), now, now, now, course_id)
            )
            conn.commit()
        
        cur.execute(
            "SELECT course_id, user_id, completed_lessons, total_lessons, test_score, completed, "
            "completed_lesson_ids, last_accessed_lesson, started_at, earned_rewards "
            "FROM course_progress_v2 WHERE user_id = %s AND course_id = %s",
            (payload['user_id'], course_id)
        )
        progress = cur.fetchone()
        progress_data = format_progress_response(progress)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'progress': progress_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'complete':
        body_data = json.loads(event.get('body', '{}'))
        complete_req = CompleteLessonRequest(**body_data)
        
        course_id = complete_req.courseId
        
        # Проверка доступа к курсу
        cur.execute(
            "SELECT access_type FROM courses_v2 WHERE id = %s",
            (course_id,)
        )
        course_data = cur.fetchone()
        
        if not course_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Курс не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        access_type = course_data[0]
        
        if access_type == 'closed':
            user_id_int = int(payload['user_id'])
            cur.execute(
                "SELECT id FROM course_assignments_v2 WHERE course_id = %s AND user_id = %s",
                (course_id, user_id_int)
            )
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Курс не назначен вам'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        # Проверяем, что урок существует в курсе
        cur.execute(
            "SELECT id FROM lessons_v2 WHERE id = %s AND course_id = %s",
            (complete_req.lessonId, course_id)
        )
        if not cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Урок не найден в этом курсе'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Получаем текущий прогресс
        cur.execute(
            "SELECT id, completed_lesson_ids FROM course_progress_v2 WHERE user_id = %s AND course_id = %s",
            (int(payload['user_id']), course_id)
        )
        progress = cur.fetchone()
        
        if not progress:
            # Создаем прогресс если его нет
            now = datetime.utcnow()
            
            cur.execute(
                "INSERT INTO course_progress_v2 (course_id, user_id, completed_lessons, total_lessons, "
                "completed, started_at, completed_lesson_ids, last_accessed_lesson, created_at, updated_at) "
                "SELECT %s, %s, 1, lessons_count, false, %s, %s, %s, %s, %s FROM courses_v2 WHERE id = %s "
                "RETURNING id",
                (course_id, int(payload['user_id']), now, 
                 json.dumps([complete_req.lessonId]), complete_req.lessonId, now, now, course_id)
            )
            progress_id = cur.fetchone()[0]
        else:
            progress_id = progress[0]
            completed_lesson_ids = progress[1] if progress[1] else []
            
            # Добавляем урок если его еще нет
            if complete_req.lessonId not in completed_lesson_ids:
                completed_lesson_ids.append(complete_req.lessonId)
                
                # Проверяем, завершен ли курс (все уроки пройдены)
                cur.execute(
                    "SELECT COUNT(*) FROM lessons_v2 WHERE course_id = %s",
                    (course_id,)
                )
                total_lessons = cur.fetchone()[0]
                is_course_completed = len(completed_lesson_ids) >= total_lessons
                
                cur.execute(
                    "UPDATE course_progress_v2 SET completed_lessons = %s, completed_lesson_ids = %s, "
                    "last_accessed_lesson = %s, completed = %s, completed_at = %s, updated_at = NOW() WHERE id = %s",
                    (len(completed_lesson_ids), json.dumps(completed_lesson_ids), 
                     complete_req.lessonId, is_course_completed, 
                     datetime.utcnow() if is_course_completed else None, progress_id)
                )
                
                # Если курс завершен, выдаем награды
                if is_course_completed:
                    # Ищем награды, привязанные к этому курсу
                    cur.execute(
                        "SELECT id FROM rewards_v2 WHERE course_id = %s",
                        (course_id,)
                    )
                    reward_ids = [row[0] for row in cur.fetchall()]
                    
                    if reward_ids:
                        # Получаем текущие награды пользователя
                        cur.execute(
                            "SELECT earned_rewards FROM course_progress_v2 WHERE id = %s",
                            (progress_id,)
                        )
                        current_rewards = cur.fetchone()[0] or []
                        
                        # Добавляем новые награды (избегаем дубликатов)
                        updated_rewards = list(set(current_rewards + reward_ids))
                        
                        # Обновляем награды в прогрессе
                        cur.execute(
                            "UPDATE course_progress_v2 SET earned_rewards = %s WHERE id = %s",
                            (json.dumps(updated_rewards), progress_id)
                        )
                        
                        # Логируем получение наград
                        new_rewards = [r for r in reward_ids if r not in current_rewards]
                        if new_rewards:
                            try:
                                cur.execute("SELECT title FROM courses_v2 WHERE id = %s", (course_id,))
                                course_row = cur.fetchone()
                                course_title = course_row[0] if course_row else f"Курс #{course_id}"
                                
                                for reward_id in new_rewards:
                                    cur.execute("SELECT title FROM rewards_v2 WHERE id = %s", (reward_id,))
                                    reward_row = cur.fetchone()
                                    reward_title = reward_row[0] if reward_row else f"Награда #{reward_id}"
                                    
                                    log_action(conn, 'success', 'reward.earned', 
                                              f"Получена награда '{reward_title}' за завершение курса '{course_title}'",
                                              user_id=int(payload['user_id']),
                                              details={'reward_id': reward_id, 'course_id': course_id})
                            except Exception as e:
                                print(f"[WARNING] Failed to log reward: {e}")
                    
                    # Логируем завершение курса
                    try:
                        cur.execute("SELECT title FROM courses_v2 WHERE id = %s", (course_id,))
                        course_row = cur.fetchone()
                        course_title = course_row[0] if course_row else f"Курс #{course_id}"
                        log_action(conn, 'success', 'course.complete', 
                                  f"Завершен курс '{course_title}'",
                                  user_id=int(payload['user_id']),
                                  details={'course_id': course_id})
                    except Exception as e:
                        print(f"[WARNING] Failed to log course completion: {e}")
        
        conn.commit()
        
        # Возвращаем обновленный прогресс
        cur.execute(
            "SELECT course_id, user_id, completed_lessons, total_lessons, test_score, completed, "
            "completed_lesson_ids, last_accessed_lesson, started_at, earned_rewards "
            "FROM course_progress_v2 WHERE user_id = %s AND course_id = %s",
            (int(payload['user_id']), course_id)
        )
        progress = cur.fetchone()
        progress_data = format_progress_response(progress)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'progress': progress_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'submit':
        body_data = json.loads(event.get('body', '{}'))
        test_req = SubmitTestRequest(**body_data)
        
        course_id = test_req.courseId
        
        # Проверка доступа к курсу
        cur.execute(
            "SELECT access_type FROM courses_v2 WHERE id = %s",
            (course_id,)
        )
        course_data = cur.fetchone()
        
        if not course_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Курс не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        access_type = course_data[0]
        
        if access_type == 'closed':
            user_id_int = int(payload['user_id'])
            cur.execute(
                "SELECT id FROM course_assignments_v2 WHERE course_id = %s AND user_id = %s",
                (course_id, user_id_int)
            )
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Курс не назначен вам'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        # Сохраняем результат теста
        now = datetime.utcnow()
        
        cur.execute(
            "INSERT INTO test_results_v2 (test_id, user_id, answers, score, passed, submitted_at, created_at) "
            "VALUES (%s, %s, %s, 0, false, %s, %s)",
            (test_req.testId, int(payload['user_id']), json.dumps(test_req.answers), now, now)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Результаты теста отправлены', 'resultId': result_id}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'reset':
        # Только админы могут сбрасывать прогресс
        if payload.get('role') != 'admin':
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Только администратор может сбрасывать прогресс'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        reset_course_id = body_data.get('courseId')
        reset_type = body_data.get('resetType', 'reset_all')
        
        if not reset_course_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Необходимо указать courseId'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        if reset_type == 'reset_all':
            # Удаляем все результаты тестов по курсу (из обеих таблиц)
            cur.execute(
                "DELETE FROM test_results WHERE course_id = %s",
                (reset_course_id,)
            )
            cur.execute(
                "DELETE FROM test_results_v2 WHERE course_id = %s",
                (reset_course_id,)
            )
            # Удаляем все попытки тестов по курсу
            cur.execute(
                "DELETE FROM test_attempts_v2 WHERE course_id = %s",
                (reset_course_id,)
            )
            # Удаляем весь прогресс по курсу (должно быть последним)
            cur.execute(
                "DELETE FROM course_progress_v2 WHERE course_id = %s",
                (reset_course_id,)
            )
        elif reset_type == 'reset_tests':
            # Удаляем только результаты тестов (по course_id, из обеих таблиц)
            cur.execute(
                "DELETE FROM test_results WHERE course_id = %s",
                (reset_course_id,)
            )
            cur.execute(
                "DELETE FROM test_results_v2 WHERE course_id = %s",
                (reset_course_id,)
            )
            # Удаляем все попытки тестов по курсу
            cur.execute(
                "DELETE FROM test_attempts_v2 WHERE course_id = %s",
                (reset_course_id,)
            )
            # Получаем ID всех уроков типа 'test' для этого курса
            cur.execute(
                "SELECT id FROM lessons_v2 WHERE course_id = %s AND type = 'test'",
                (reset_course_id,)
            )
            test_lesson_ids = [str(row[0]) for row in cur.fetchall()]
            
            # Для каждого прогресса удаляем из completed_lesson_ids только тестовые уроки
            cur.execute(
                "SELECT user_id, completed_lesson_ids FROM course_progress_v2 WHERE course_id = %s",
                (reset_course_id,)
            )
            progress_rows = cur.fetchall()
            
            for user_id, completed_ids in progress_rows:
                if completed_ids:
                    # Убираем ID тестовых уроков из массива
                    updated_ids = [lid for lid in completed_ids if lid not in test_lesson_ids]
                    
                    # Обновляем прогресс
                    cur.execute(
                        "UPDATE course_progress_v2 SET "
                        "completed_lesson_ids = %s, "
                        "completed_lessons = %s, "
                        "test_score = 0, "
                        "completed = false, "
                        "earned_rewards = '[]'::jsonb "
                        "WHERE course_id = %s AND user_id = %s",
                        (json.dumps(updated_ids), len(updated_ids), reset_course_id, user_id)
                    )
        # Если reset_type == 'keep', ничего не делаем
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Прогресс успешно сброшен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE':
        # Только админ может удалять прогресс
        if payload.get('role') != 'admin':
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        if not user_id or not course_id_int:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId и courseId обязательны'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Удаляем результаты тестов пользователя по этому курсу (из обеих таблиц)
        cur.execute(
            "DELETE FROM test_results WHERE user_id = %s AND course_id = %s",
            (int(user_id), course_id_int)
        )
        cur.execute(
            "DELETE FROM test_results_v2 WHERE user_id = %s AND course_id = %s",
            (int(user_id), course_id_int)
        )
        
        # Удаляем попытки тестов пользователя по этому курсу
        cur.execute(
            "DELETE FROM test_attempts_v2 WHERE user_id = %s AND course_id = %s",
            (int(user_id), course_id_int)
        )
        
        # Удаляем прогресс пользователя по курсу
        cur.execute(
            "DELETE FROM course_progress_v2 WHERE user_id = %s AND course_id = %s",
            (int(user_id), course_id_int)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Прогресс удален'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Неверный запрос'}, ensure_ascii=False),
        'isBase64Encoded': False
    }