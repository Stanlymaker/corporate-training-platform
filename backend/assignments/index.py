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

class AssignCourseRequest(BaseModel):
    courseId: str = Field(..., min_length=1)
    userId: str = Field(..., min_length=1)
    dueDate: Optional[str] = None
    notes: Optional[str] = None

def get_db_connection():
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        return None

def require_admin(headers: Dict[str, Any]) -> tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not auth_token:
        return None, {'statusCode': 401, 'error': 'Токен отсутствует'}
    
    payload = verify_jwt_token(auth_token)
    if not payload:
        return None, {'statusCode': 401, 'error': 'Недействительный токен'}
    
    if payload.get('role') != 'admin':
        return None, {'statusCode': 403, 'error': 'Доступ запрещен. Требуются права администратора'}
    
    return payload, None

def format_assignment_response(assignment_row: tuple) -> Dict[str, Any]:
    return {
        'id': assignment_row[0],
        'courseId': assignment_row[1],
        'userId': assignment_row[2],
        'assignedBy': assignment_row[3],
        'assignedAt': assignment_row[4].isoformat() if assignment_row[4] else None,
        'dueDate': assignment_row[5].isoformat() if assignment_row[5] else None,
        'status': assignment_row[6],
        'notes': assignment_row[7],
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Назначение курсов студентам (только админ)
    POST - назначить курс студенту
    GET ?userId=x - все назначения студента
    GET ?courseId=x - все назначения курса
    DELETE ?courseId=x&userId=x - отменить назначение
    DELETE ?id=x - удалить назначение по ID
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
    assignment_id = query_params.get('id')
    user_id_param = query_params.get('userId')
    course_id_param = query_params.get('courseId')
    
    payload, admin_error = require_admin(headers)
    if admin_error:
        return {
            'statusCode': admin_error['statusCode'],
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': admin_error['error']}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Если course_id_param - это display_id (число), преобразуем в UUID
    course_uuid = None
    if course_id_param:
        try:
            display_id = int(course_id_param)
            cur.execute("SELECT id FROM courses WHERE display_id = %s", (display_id,))
            course_row = cur.fetchone()
            if course_row:
                course_uuid = course_row[0]
            else:
                course_uuid = course_id_param  # Возможно это уже UUID
        except ValueError:
            course_uuid = course_id_param  # Это UUID
    
    if method == 'GET':
        # GET без параметров - все assignments (только для админа)
        if not user_id_param and not course_uuid:
            cur.execute(
                "SELECT id, course_id, user_id, assigned_by, assigned_at, due_date, status, notes "
                "FROM course_assignments ORDER BY assigned_at DESC"
            )
            assignments = cur.fetchall()
            assignments_list = [format_assignment_response(a) for a in assignments]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'assignments': assignments_list}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # GET с userId - assignments конкретного пользователя
        if user_id_param:
            cur.execute(
                "SELECT id, course_id, user_id, assigned_by, assigned_at, due_date, status, notes "
                "FROM course_assignments WHERE user_id = %s ORDER BY assigned_at DESC",
                (user_id_param,)
            )
            assignments = cur.fetchall()
            assignments_list = [format_assignment_response(a) for a in assignments]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'assignments': assignments_list}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # GET с courseId - assignments конкретного курса
        if course_uuid:
            cur.execute(
                "SELECT id, course_id, user_id, assigned_by, assigned_at, due_date, status, notes "
                "FROM course_assignments WHERE course_id = %s ORDER BY assigned_at DESC",
                (course_uuid,)
            )
            assignments = cur.fetchall()
            assignments_list = [format_assignment_response(a) for a in assignments]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'assignments': assignments_list}, ensure_ascii=False),
                'isBase64Encoded': False
            }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        assign_req = AssignCourseRequest(**body_data)
        
        # Преобразуем courseId в UUID если это display_id
        try:
            display_id = int(assign_req.courseId)
            cur.execute("SELECT id FROM courses WHERE display_id = %s", (display_id,))
            course_row = cur.fetchone()
            if course_row:
                course_uuid_for_assign = course_row[0]
            else:
                course_uuid_for_assign = assign_req.courseId
        except ValueError:
            course_uuid_for_assign = assign_req.courseId
        
        cur.execute(
            "SELECT id FROM course_assignments WHERE course_id = %s AND user_id = %s",
            (course_uuid_for_assign, assign_req.userId)
        )
        if cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Курс уже назначен этому пользователю'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        new_assignment_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        cur.execute(
            "INSERT INTO course_assignments (id, course_id, user_id, assigned_by, assigned_at, due_date, status, notes, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, course_id, user_id, assigned_by, assigned_at, due_date, status, notes",
            (new_assignment_id, course_uuid_for_assign, assign_req.userId, payload['user_id'],
             now, assign_req.dueDate, 'assigned', assign_req.notes, now)
        )
        new_assignment = cur.fetchone()
        
        cur.execute(
            "INSERT INTO course_progress (id, course_id, user_id, completed_lessons, total_lessons, completed, started_at, created_at, updated_at) "
            "SELECT %s, %s, %s, 0, lessons_count, false, %s, %s, %s FROM courses WHERE id = %s "
            "ON CONFLICT (course_id, user_id) DO NOTHING",
            (str(uuid.uuid4()), course_uuid_for_assign, assign_req.userId, now, now, now, course_uuid_for_assign)
        )
        conn.commit()
        
        assignment_data = format_assignment_response(new_assignment)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'assignment': assignment_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE' and course_id_param and user_id_param:
        cur.execute(
            "DELETE FROM course_progress WHERE course_id = %s AND user_id = %s",
            (course_id_param, user_id_param)
        )
        
        cur.execute(
            "DELETE FROM course_assignments WHERE course_id = %s AND user_id = %s",
            (course_id_param, user_id_param)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Назначение отменено'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE' and assignment_id:
        cur.execute(
            "SELECT course_id, user_id FROM course_assignments WHERE id = %s",
            (assignment_id,)
        )
        assignment = cur.fetchone()
        
        if not assignment:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Назначение не найдено'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "DELETE FROM course_progress WHERE course_id = %s AND user_id = %s",
            (assignment[0], assignment[1])
        )
        
        cur.execute(
            "DELETE FROM course_assignments WHERE id = %s",
            (assignment_id,)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Назначение удалено'}, ensure_ascii=False),
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