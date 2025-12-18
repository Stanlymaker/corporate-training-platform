import json
import os
import psycopg2
import bcrypt
import jwt
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field, ValidationError

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1)
    role: str = Field(..., pattern='^(admin|student)$')
    password: str = Field(..., min_length=8)
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None

class UpdatePasswordRequest(BaseModel):
    password: str = Field(..., min_length=8)

class UpdateRoleRequest(BaseModel):
    role: str = Field(..., pattern='^(admin|student)$')

def get_db_connection():
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        return None

def require_admin(headers: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not auth_token:
        return {'statusCode': 401, 'error': 'Токен отсутствует'}
    
    payload = verify_jwt_token(auth_token)
    if not payload:
        return {'statusCode': 401, 'error': 'Недействительный токен'}
    
    if payload.get('role') != 'admin':
        return {'statusCode': 403, 'error': 'Доступ запрещен. Требуются права администратора'}
    
    return None

def format_user_response(user_row: tuple) -> Dict[str, Any]:
    return {
        'id': user_row[0],
        'email': user_row[1],
        'name': user_row[2],
        'role': user_row[3],
        'position': user_row[4],
        'department': user_row[5],
        'phone': user_row[6],
        'avatar': user_row[7],
        'isActive': user_row[8],
        'registrationDate': user_row[9].isoformat() if user_row[9] else None,
        'lastActive': user_row[10].isoformat() if user_row[10] else None,
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    CRUD операции с пользователями (только для администраторов)
    GET ?id=x - данные пользователя, без id - все пользователи
    POST - создание пользователя
    PUT ?id=x&action=password - изменение пароля
    PUT ?id=x&action=role - изменение роли
    PUT ?id=x&action=toggle - включение/отключение
    PUT ?id=x - обновление профиля
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
    user_id = query_params.get('id')
    action = query_params.get('action', '')
    
    # Проверка авторизации
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Токен отсутствует'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    payload = verify_jwt_token(auth_token)
    if not payload:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Недействительный токен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    current_user_id = payload.get('user_id')
    current_user_role = payload.get('role')
    
    # Проверка прав: админы могут все, студенты только свой профиль
    if method == 'PUT' and user_id and user_id == current_user_id:
        # Студент редактирует свой профиль - разрешено
        pass
    elif current_user_role != 'admin':
        # Не админ пытается делать что-то кроме редактирования своего профиля
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Доступ запрещен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    if method == 'GET' and not user_id:
        cur.execute(
            "SELECT id, email, name, role, position, department, phone, avatar, is_active, "
            "registration_date, last_active FROM users_v2 ORDER BY registration_date DESC"
        )
        users = cur.fetchall()
        users_list = [format_user_response(user) for user in users]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'users': users_list}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET' and user_id:
        cur.execute(
            "SELECT id, email, name, role, position, department, phone, avatar, is_active, "
            "registration_date, last_active FROM users_v2 WHERE id = %s",
            (user_id,)
        )
        user = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        user_data = format_user_response(user)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'user': user_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        create_req = CreateUserRequest(**body_data)
        
        cur.execute("SELECT id FROM users_v2 WHERE email = %s", (create_req.email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь с таким email уже существует'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        password_hash = bcrypt.hashpw(create_req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        now = datetime.utcnow()
        
        cur.execute(
            "INSERT INTO users_v2 (email, name, password_hash, role, position, department, phone, "
            "is_active, registration_date, last_active, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, email, name, role, position, department, phone, avatar, is_active, "
            "registration_date, last_active",
            (create_req.email, create_req.name, password_hash, create_req.role,
             create_req.position, create_req.department, create_req.phone, True, now, now, now, now)
        )
        new_user = cur.fetchone()
        conn.commit()
        
        user_data = format_user_response(new_user)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'user': user_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and user_id and action == 'password':
        body_data = json.loads(event.get('body', '{}'))
        pwd_req = UpdatePasswordRequest(**body_data)
        
        password_hash = bcrypt.hashpw(pwd_req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute(
            "UPDATE users_v2 SET password_hash = %s, updated_at = %s WHERE id = %s",
            (password_hash, datetime.utcnow(), user_id)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Пароль успешно изменен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and user_id and action == 'role':
        body_data = json.loads(event.get('body', '{}'))
        role_req = UpdateRoleRequest(**body_data)
        
        cur.execute(
            "UPDATE users_v2 SET role = %s, updated_at = %s WHERE id = %s",
            (role_req.role, datetime.utcnow(), user_id)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Роль успешно изменена'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and user_id and action == 'toggle':
        body_data = json.loads(event.get('body', '{}'))
        is_active = body_data.get('isActive', True)
        
        cur.execute(
            "UPDATE users_v2 SET is_active = %s, updated_at = %s WHERE id = %s",
            (is_active, datetime.utcnow(), user_id)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Статус учетной записи изменен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and user_id:
        body_data = json.loads(event.get('body', '{}'))
        update_req = UpdateUserRequest(**body_data)
        
        update_fields = []
        update_values = []
        
        if update_req.name is not None:
            update_fields.append('name = %s')
            update_values.append(update_req.name)
        if update_req.position is not None:
            update_fields.append('position = %s')
            update_values.append(update_req.position)
        if update_req.department is not None:
            update_fields.append('department = %s')
            update_values.append(update_req.department)
        if update_req.phone is not None:
            update_fields.append('phone = %s')
            update_values.append(update_req.phone)
        if update_req.avatar is not None:
            update_fields.append('avatar = %s')
            update_values.append(update_req.avatar)
        
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
        update_values.append(user_id)
        
        query = f"UPDATE users_v2 SET {', '.join(update_fields)} WHERE id = %s RETURNING id, email, name, role, position, department, phone, avatar, is_active, registration_date, last_active"
        
        cur.execute(query, update_values)
        updated_user = cur.fetchone()
        conn.commit()
        
        if not updated_user:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        user_data = format_user_response(updated_user)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'user': user_data}, ensure_ascii=False),
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