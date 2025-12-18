import json
import os
import psycopg2
import jwt
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

class CreateLessonRequest(BaseModel):
    courseId: int = Field(..., ge=1)
    title: str = Field(..., min_length=1)
    content: Optional[str] = None
    type: str = Field(..., pattern='^(text|video|pdf|quiz|test)$')
    order: int = Field(..., ge=0)
    duration: int = Field(default=0, ge=0)
    videoUrl: Optional[str] = None
    description: Optional[str] = None
    requiresPrevious: bool = Field(default=False)
    testId: Optional[str] = None
    isFinalTest: bool = Field(default=False)
    finalTestRequiresAllLessons: bool = Field(default=False)
    finalTestRequiresAllTests: bool = Field(default=False)

class UpdateLessonRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    content: Optional[str] = None
    type: Optional[str] = Field(None, pattern='^(text|video|pdf|quiz|test)$')
    order: Optional[int] = Field(None, ge=0)
    duration: Optional[int] = Field(None, ge=0)
    videoUrl: Optional[str] = None
    description: Optional[str] = None
    requiresPrevious: Optional[bool] = None
    testId: Optional[str] = None
    isFinalTest: Optional[bool] = None
    finalTestRequiresAllLessons: Optional[bool] = None
    finalTestRequiresAllTests: Optional[bool] = None

class LessonMaterialRequest(BaseModel):
    title: str = Field(..., min_length=1)
    type: str = Field(..., pattern='^(pdf|doc|link|video)$')
    url: str = Field(..., min_length=1)

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

def require_admin(headers: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    payload, error = require_auth(headers)
    if error:
        return error
    
    if payload.get('role') != 'admin':
        return {'statusCode': 403, 'error': 'Доступ запрещен. Требуются права администратора'}
    
    return None

def format_lesson_response(lesson_row: tuple, materials: list = None) -> Dict[str, Any]:
    lesson_data = {
        'id': lesson_row[0],
        'courseId': lesson_row[1],
        'title': lesson_row[2],
        'content': lesson_row[3],
        'type': lesson_row[4],
        'order': lesson_row[5],
        'duration': lesson_row[6],
        'videoUrl': lesson_row[7],
        'description': lesson_row[8],
        'requiresPrevious': lesson_row[9],
        'testId': lesson_row[10],
        'isFinalTest': lesson_row[11],
        'finalTestRequiresAllLessons': lesson_row[12],
        'finalTestRequiresAllTests': lesson_row[13],
    }
    
    if materials is not None:
        lesson_data['materials'] = materials
    
    return lesson_data

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление уроками
    GET ?courseId=x - все уроки курса
    GET ?id=x - один урок
    POST - создать урок (только админ)
    PUT ?id=x - обновить урок (только админ)
    POST ?lessonId=x&action=material - добавить материал (админ)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {}) or {}
    lesson_id = query_params.get('id')
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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    if method == 'GET' and course_id:
        course_id_int = int(course_id)
        
        if payload.get('role') != 'admin':
            cur.execute(
                "SELECT id FROM course_assignments_v2 WHERE course_id = %s AND user_id = %s",
                (course_id_int, payload['user_id'])
            )
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Доступ к курсу запрещен'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        cur.execute(
            "SELECT id, course_id, title, content, type, \"order\", duration, video_url, "
            "description, requires_previous, test_id, is_final_test, "
            "final_test_requires_all_lessons, final_test_requires_all_tests "
            "FROM lessons_v2 WHERE course_id = %s ORDER BY \"order\"",
            (course_id_int,)
        )
        lessons = cur.fetchall()
        
        lessons_list = []
        for lesson in lessons:
            cur.execute(
                "SELECT id, title, type, url FROM lesson_materials_v2 WHERE lesson_id = %s",
                (lesson[0],)
            )
            materials_rows = cur.fetchall()
            materials = [{'id': m[0], 'title': m[1], 'type': m[2], 'url': m[3]} for m in materials_rows]
            lessons_list.append(format_lesson_response(lesson, materials))
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'lessons': lessons_list}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET' and lesson_id:
        cur.execute(
            "SELECT id, course_id, title, content, type, \"order\", duration, video_url, "
            "description, requires_previous, test_id, is_final_test, "
            "final_test_requires_all_lessons, final_test_requires_all_tests "
            "FROM lessons_v2 WHERE id = %s",
            (lesson_id,)
        )
        lesson = cur.fetchone()
        
        if not lesson:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Урок не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        if payload.get('role') != 'admin':
            cur.execute(
                "SELECT id FROM course_assignments_v2 WHERE course_id = %s AND user_id = %s",
                (lesson[1], payload['user_id'])
            )
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Доступ к уроку запрещен'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        cur.execute(
            "SELECT id, title, type, url FROM lesson_materials_v2 WHERE lesson_id = %s",
            (lesson_id,)
        )
        materials_rows = cur.fetchall()
        materials = [{'id': m[0], 'title': m[1], 'type': m[2], 'url': m[3]} for m in materials_rows]
        
        lesson_data = format_lesson_response(lesson, materials)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'lesson': lesson_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'material':
        admin_error = require_admin(headers)
        if admin_error:
            cur.close()
            conn.close()
            return {
                'statusCode': admin_error['statusCode'],
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': admin_error['error']}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        lesson_id_param = query_params.get('lessonId')
        if not lesson_id_param:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'lessonId обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        try:
            body = json.loads(event.get('body', '{}'))
            material_req = LessonMaterialRequest(**body)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Verify lesson exists
        cur.execute("SELECT id FROM lessons_v2 WHERE id = %s", (lesson_id_param,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Урок не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO lesson_materials_v2 (lesson_id, title, type, url) VALUES (%s, %s, %s, %s) RETURNING id",
            (lesson_id_param, material_req.title, material_req.type, material_req.url)
        )
        material_id = cur.fetchone()[0]
        
        conn.commit()
        
        cur.execute(
            "SELECT id, title, type, url FROM lesson_materials_v2 WHERE id = %s",
            (material_id,)
        )
        material = cur.fetchone()
        material_data = {'id': material[0], 'title': material[1], 'type': material[2], 'url': material[3]}
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'material': material_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        admin_error = require_admin(headers)
        if admin_error:
            cur.close()
            conn.close()
            return {
                'statusCode': admin_error['statusCode'],
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': admin_error['error']}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        try:
            body = json.loads(event.get('body', '{}'))
            create_req = CreateLessonRequest(**body)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        course_id = create_req.courseId
        
        # Verify course exists
        cur.execute("SELECT id FROM courses_v2 WHERE id = %s", (course_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Курс не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO lessons_v2 (course_id, title, content, type, \"order\", duration, video_url, "
            "description, requires_previous, test_id, is_final_test, final_test_requires_all_lessons, "
            "final_test_requires_all_tests) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                course_id,
                create_req.title,
                create_req.content,
                create_req.type,
                create_req.order,
                create_req.duration,
                create_req.videoUrl,
                create_req.description,
                create_req.requiresPrevious,
                create_req.testId,
                create_req.isFinalTest,
                create_req.finalTestRequiresAllLessons,
                create_req.finalTestRequiresAllTests
            )
        )
        lesson_id = cur.fetchone()[0]
        
        conn.commit()
        
        cur.execute(
            "SELECT id, course_id, title, content, type, \"order\", duration, video_url, "
            "description, requires_previous, test_id, is_final_test, "
            "final_test_requires_all_lessons, final_test_requires_all_tests "
            "FROM lessons_v2 WHERE id = %s",
            (lesson_id,)
        )
        lesson = cur.fetchone()
        lesson_data = format_lesson_response(lesson, [])
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'lesson': lesson_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and lesson_id:
        admin_error = require_admin(headers)
        if admin_error:
            cur.close()
            conn.close()
            return {
                'statusCode': admin_error['statusCode'],
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': admin_error['error']}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        try:
            body = json.loads(event.get('body', '{}'))
            update_req = UpdateLessonRequest(**body)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Check if lesson exists
        cur.execute("SELECT id FROM lessons_v2 WHERE id = %s", (lesson_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Урок не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Build update query
        updates = []
        params = []
        
        if update_req.title is not None:
            updates.append("title = %s")
            params.append(update_req.title)
        if update_req.content is not None:
            updates.append("content = %s")
            params.append(update_req.content)
        if update_req.type is not None:
            updates.append("type = %s")
            params.append(update_req.type)
        if update_req.order is not None:
            updates.append('"order" = %s')
            params.append(update_req.order)
        if update_req.duration is not None:
            updates.append("duration = %s")
            params.append(update_req.duration)
        if update_req.videoUrl is not None:
            updates.append("video_url = %s")
            params.append(update_req.videoUrl)
        if update_req.description is not None:
            updates.append("description = %s")
            params.append(update_req.description)
        if update_req.requiresPrevious is not None:
            updates.append("requires_previous = %s")
            params.append(update_req.requiresPrevious)
        if update_req.testId is not None:
            updates.append("test_id = %s")
            params.append(update_req.testId)
        if update_req.isFinalTest is not None:
            updates.append("is_final_test = %s")
            params.append(update_req.isFinalTest)
        if update_req.finalTestRequiresAllLessons is not None:
            updates.append("final_test_requires_all_lessons = %s")
            params.append(update_req.finalTestRequiresAllLessons)
        if update_req.finalTestRequiresAllTests is not None:
            updates.append("final_test_requires_all_tests = %s")
            params.append(update_req.finalTestRequiresAllTests)
        
        if not updates:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет данных для обновления'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        params.append(lesson_id)
        query = f"UPDATE lessons_v2 SET {', '.join(updates)} WHERE id = %s"
        cur.execute(query, params)
        
        conn.commit()
        
        cur.execute(
            "SELECT id, course_id, title, content, type, \"order\", duration, video_url, "
            "description, requires_previous, test_id, is_final_test, "
            "final_test_requires_all_lessons, final_test_requires_all_tests "
            "FROM lessons_v2 WHERE id = %s",
            (lesson_id,)
        )
        lesson = cur.fetchone()
        
        cur.execute(
            "SELECT id, title, type, url FROM lesson_materials_v2 WHERE lesson_id = %s",
            (lesson_id,)
        )
        materials_rows = cur.fetchall()
        materials = [{'id': m[0], 'title': m[1], 'type': m[2], 'url': m[3]} for m in materials_rows]
        
        lesson_data = format_lesson_response(lesson, materials)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'lesson': lesson_data}, ensure_ascii=False),
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