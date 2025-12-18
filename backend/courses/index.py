import json
import os
import psycopg2
import psycopg2.extras
import jwt
from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

class CreateCourseRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    duration: int = Field(default=0, ge=0)
    category: Optional[str] = None
    image: Optional[str] = None
    passScore: int = Field(default=70, ge=0, le=100)
    level: Optional[str] = None
    instructor: Optional[str] = None
    accessType: str = Field(default='closed', pattern='^(open|closed)$')

class UpdateCourseRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0)
    category: Optional[str] = None
    image: Optional[str] = None
    published: Optional[bool] = None
    passScore: Optional[int] = Field(None, ge=0, le=100)
    level: Optional[str] = None
    instructor: Optional[str] = None
    status: Optional[str] = Field(None, pattern='^(draft|published|archived)$')
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    accessType: Optional[str] = Field(None, pattern='^(open|closed)$')

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

def format_course_response(course_row: tuple) -> Dict[str, Any]:
    return {
        'id': course_row[0],
        'title': course_row[1],
        'description': course_row[2],
        'duration': course_row[3],
        'lessonsCount': course_row[4],
        'category': course_row[5],
        'image': course_row[6],
        'published': course_row[7],
        'passScore': course_row[8],
        'level': course_row[9],
        'instructor': course_row[10],
        'status': course_row[11],
        'startDate': course_row[12].isoformat() if course_row[12] else None,
        'endDate': course_row[13].isoformat() if course_row[13] else None,
        'accessType': course_row[14],
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление курсами
    GET / - все курсы (админ видит все, студент только назначенные)
    GET ?id=x - один курс
    POST / - создать курс (только админ)
    PUT ?id=x - обновить курс (только админ)
    DELETE ?id=x - удалить курс (только админ)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {}) or {}
    course_id_param = query_params.get('id')
    
    course_id = None
    if course_id_param:
        try:
            course_id = int(course_id_param)
        except ValueError:
            pass
    
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
    
    if method == 'GET' and not course_id:
        if payload.get('role') == 'admin':
            cur.execute(
                "SELECT id, title, description, duration, lessons_count, category, image, published, "
                "pass_score, level, instructor, status, start_date, end_date, access_type "
                "FROM courses_v2 ORDER BY created_at DESC"
            )
        else:
            cur.execute(
                "SELECT id, title, description, duration, lessons_count, category, image, "
                "published, pass_score, level, instructor, status, start_date, end_date, access_type "
                "FROM courses_v2 WHERE published = true AND access_type = 'open'"
            )
            open_courses = cur.fetchall()
            
            cur.execute(
                "SELECT c.id, c.title, c.description, c.duration, c.lessons_count, c.category, c.image, "
                "c.published, c.pass_score, c.level, c.instructor, c.status, c.start_date, c.end_date, c.access_type "
                "FROM courses_v2 c INNER JOIN course_assignments_v2 ca ON c.id = ca.course_id "
                "WHERE c.published = true AND c.access_type = 'closed' AND ca.user_id = %s",
                (payload['user_id'],)
            )
            closed_courses = cur.fetchall()
            
            courses = list(open_courses) + list(closed_courses)
            courses.sort(key=lambda x: x[0], reverse=True)
        
        if payload.get('role') == 'admin':
            courses = cur.fetchall()
        
        courses_list = [format_course_response(course) for course in courses]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'courses': courses_list}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET' and course_id:
        cur.execute(
            "SELECT id, title, description, duration, lessons_count, category, image, published, "
            "pass_score, level, instructor, status, start_date, end_date, access_type "
            "FROM courses_v2 WHERE id = %s",
            (course_id,)
        )
        course = cur.fetchone()
        
        if not course:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Курс не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        if payload.get('role') != 'admin':
            course_access_type = course[14]
            
            if course_access_type == 'closed':
                cur.execute(
                    "SELECT id FROM course_assignments_v2 WHERE course_id = %s AND user_id = %s",
                    (course_id, payload['user_id'])
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
        
        course_data = format_course_response(course)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'course': course_data}, ensure_ascii=False),
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
        
        body_data = json.loads(event.get('body', '{}'))
        create_req = CreateCourseRequest(**body_data)
        
        now = datetime.utcnow()
        
        cur.execute(
            "INSERT INTO courses_v2 (title, description, duration, lessons_count, category, image, "
            "published, pass_score, level, instructor, status, access_type, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, title, description, duration, lessons_count, category, image, published, "
            "pass_score, level, instructor, status, start_date, end_date, access_type",
            (create_req.title, create_req.description, create_req.duration, 0,
             create_req.category, create_req.image, False, create_req.passScore, create_req.level,
             create_req.instructor, 'draft', create_req.accessType, now, now)
        )
        new_course = cur.fetchone()
        conn.commit()
        
        course_data = format_course_response(new_course)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'course': course_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and course_id:
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
        
        body_data = json.loads(event.get('body', '{}'))
        update_req = UpdateCourseRequest(**body_data)
        
        update_fields = []
        update_values = []
        
        if update_req.title is not None:
            update_fields.append('title = %s')
            update_values.append(update_req.title)
        if update_req.description is not None:
            update_fields.append('description = %s')
            update_values.append(update_req.description)
        if update_req.duration is not None:
            update_fields.append('duration = %s')
            update_values.append(update_req.duration)
        if update_req.category is not None:
            update_fields.append('category = %s')
            update_values.append(update_req.category)
        if update_req.image is not None:
            update_fields.append('image = %s')
            update_values.append(update_req.image)
        if update_req.published is not None:
            update_fields.append('published = %s')
            update_values.append(update_req.published)
        if update_req.passScore is not None:
            update_fields.append('pass_score = %s')
            update_values.append(update_req.passScore)
        if update_req.level is not None:
            update_fields.append('level = %s')
            update_values.append(update_req.level)
        if update_req.instructor is not None:
            update_fields.append('instructor = %s')
            update_values.append(update_req.instructor)
        if update_req.status is not None:
            update_fields.append('status = %s')
            update_values.append(update_req.status)
        if update_req.startDate is not None:
            update_fields.append('start_date = %s')
            update_values.append(update_req.startDate)
        if update_req.endDate is not None:
            update_fields.append('end_date = %s')
            update_values.append(update_req.endDate)
        if update_req.accessType is not None:
            update_fields.append('access_type = %s')
            update_values.append(update_req.accessType)
        
        if not update_fields:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет полей для обновления'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        update_fields.append('updated_at = %s')
        update_values.append(datetime.utcnow())
        
        update_values.append(course_id)
        query = f"UPDATE courses_v2 SET {', '.join(update_fields)} WHERE id = %s RETURNING id, title, description, duration, lessons_count, category, image, published, pass_score, level, instructor, status, start_date, end_date, access_type"
        
        cur.execute(query, update_values)
        updated_course = cur.fetchone()
        conn.commit()
        
        if not updated_course:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Курс не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        course_data = format_course_response(updated_course)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'course': course_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE' and course_id:
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
            cur.execute("DELETE FROM course_progress_v2 WHERE course_id = %s", (course_id,))
            cur.execute("DELETE FROM course_assignments_v2 WHERE course_id = %s", (course_id,))
            cur.execute("DELETE FROM lessons_v2 WHERE course_id = %s", (course_id,))
            cur.execute("DELETE FROM courses_v2 WHERE id = %s", (course_id,))
            
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Курс успешно удален'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        except Exception as e:
            print(f'Error deleting course: {str(e)}')
            conn.rollback()
            cur.close()
            conn.close()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Ошибка при удалении курса: {str(e)}'}, ensure_ascii=False),
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