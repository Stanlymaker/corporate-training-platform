import json
import psycopg2
from typing import Optional, Dict, Any

def log_action(
    conn: psycopg2.extensions.connection,
    level: str,
    action: str,
    message: str,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> None:
    '''
    Создает запись в system_logs
    Args:
        conn - psycopg2 connection
        level - 'info', 'success', 'warning', 'error'
        action - тип действия (например 'user.login', 'course.create')
        message - текстовое описание
        user_id - ID пользователя (опционально)
        ip_address - IP адрес (опционально)
        user_agent - User-Agent (опционально)
        details - дополнительная информация в JSON (опционально)
    '''
    try:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO system_logs 
                (level, action, message, user_id, ip_address, user_agent, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                level, 
                action, 
                message, 
                user_id, 
                ip_address, 
                user_agent,
                json.dumps(details) if details else None
            ))
            conn.commit()
    except Exception as e:
        print(f"[WARNING] Failed to create log: {e}")

def get_client_ip(event: Dict[str, Any]) -> Optional[str]:
    '''Извлекает IP адрес клиента из event'''
    request_context = event.get('requestContext', {})
    identity = request_context.get('identity', {})
    return identity.get('sourceIp')

def get_user_agent(event: Dict[str, Any]) -> Optional[str]:
    '''Извлекает User-Agent из event'''
    headers = event.get('headers', {})
    return headers.get('User-Agent') or headers.get('user-agent')
