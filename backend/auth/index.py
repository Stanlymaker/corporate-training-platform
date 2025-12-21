import json
import os
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field, ValidationError

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

def get_client_ip(event: Dict[str, Any]) -> Optional[str]:
    request_context = event.get('requestContext', {})
    identity = request_context.get('identity', {})
    return identity.get('sourceIp')

def get_user_agent(event: Dict[str, Any]) -> Optional[str]:
    headers = event.get('headers', {})
    return headers.get('User-Agent') or headers.get('user-agent')

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    isActive: bool
    registrationDate: str
    lastActive: str

def get_db_connection():
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def create_jwt_token(user_id: int, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
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
    Аутентификация пользователей: вход, выход, проверка токена
    Endpoints: POST ?action=login, POST ?action=logout, GET ?action=me
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
    
    if method == 'POST' and action == 'login':
        body_data = json.loads(event.get('body', '{}'))
        print(f"[DEBUG] Login attempt - body: {body_data}")
        login_req = LoginRequest(**body_data)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id, email, name, role, position, department, phone, avatar, is_active, "
            "registration_date, last_active, password_hash "
            "FROM users_v2 WHERE email = %s",
            (login_req.email,)
        )
        user = cur.fetchone()
        
        if not user:
            print(f"[DEBUG] User not found: {login_req.email}")
            log_action(
                conn, 'warning', 'user.failed_login',
                f'Неудачная попытка входа: пользователь не найден',
                ip_address=get_client_ip(event),
                user_agent=get_user_agent(event),
                details={'email': login_req.email, 'reason': 'user_not_found'}
            )
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        print(f"[DEBUG] User found: {user[1]}, is_active: {user[8]}")
        
        if not user[8]:
            print(f"[DEBUG] User account disabled: {user[1]}")
            log_action(
                conn, 'warning', 'user.failed_login',
                f'Попытка входа в отключенную учетную запись: {user[2]}',
                user_id=user[0],
                ip_address=get_client_ip(event),
                user_agent=get_user_agent(event),
                details={'email': user[1], 'reason': 'account_disabled'}
            )
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Учетная запись отключена'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        password_hash = user[11]
        print(f"[DEBUG] Checking password for: {user[1]}")
        print(f"[DEBUG] Password hash from DB: {password_hash[:20]}...")
        print(f"[DEBUG] Password to check: {login_req.password}")
        
        try:
            password_match = bcrypt.checkpw(login_req.password.encode('utf-8'), password_hash.encode('utf-8'))
            print(f"[DEBUG] Password match result: {password_match}")
        except Exception as e:
            print(f"[DEBUG] Password check exception: {e}")
            password_match = False
        
        if not password_match:
            print(f"[DEBUG] Password check failed for: {user[1]}")
            log_action(
                conn, 'warning', 'user.failed_login',
                f'Неверный пароль для пользователя: {user[2]}',
                user_id=user[0],
                ip_address=get_client_ip(event),
                user_agent=get_user_agent(event),
                details={'email': user[1], 'reason': 'wrong_password'}
            )
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        print(f"[DEBUG] Login successful for user: {user[1]}")
        
        cur.execute(
            "UPDATE users_v2 SET last_active = %s WHERE id = %s",
            (datetime.utcnow(), user[0])
        )
        conn.commit()
        
        log_action(
            conn, 'success', 'user.login',
            f'Пользователь {user[2]} успешно вошел в систему',
            user_id=user[0],
            ip_address=get_client_ip(event),
            user_agent=get_user_agent(event),
            details={'email': user[1], 'role': user[3]}
        )
        
        token = create_jwt_token(user[0], user[1], user[3])
        user_data = format_user_response(user[:11])
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'token': token, 'user': user_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'logout':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Выход выполнен'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'verify':
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
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'valid': True}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET' and action == 'me':
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
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id, email, name, role, position, department, phone, avatar, is_active, "
            "registration_date, last_active FROM users_v2 WHERE id = %s",
            (payload['user_id'],)
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
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Маршрут не найден'}, ensure_ascii=False),
        'isBase64Encoded': False
    }