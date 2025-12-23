import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ValidationError

class RewardCreate(BaseModel):
    name: str = Field(..., min_length=1)
    icon: str = Field(..., min_length=1)
    color: str = Field(..., min_length=1)
    course_id: int
    description: Optional[str] = None
    condition: Optional[str] = None
    bonuses: Optional[List[str]] = None

class RewardUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    course_id: Optional[int] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    bonuses: Optional[List[str]] = None

def get_db_connection():
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление наградами: получение, создание, обновление, удаление наград
    Endpoints: GET, POST, PUT, DELETE
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
    
    if method == 'GET':
        conn = get_db_connection()
        cur = conn.cursor()
        
        reward_id = query_params.get('id')
        course_id = query_params.get('courseId')
        
        if reward_id:
            cur.execute(
                "SELECT id, name, icon, color, course_id, description, condition, bonuses, created_at "
                "FROM rewards_v2 WHERE id = %s",
                (reward_id,)
            )
            row = cur.fetchone()
            
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Награда не найдена'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Считаем сколько пользователей получили эту награду через JSONB
            cur.execute(
                "SELECT COUNT(*) FROM course_progress_v2 WHERE earned_rewards @> %s::jsonb",
                (f'[{reward_id}]',)
            )
            earned_count = cur.fetchone()[0]
            
            reward = {
                'id': row[0],
                'name': row[1],
                'icon': row[2],
                'color': row[3],
                'courseId': row[4],
                'description': row[5],
                'condition': row[6],
                'bonuses': row[7] if row[7] else [],
                'createdAt': row[8].isoformat() if row[8] else None,
                'earnedCount': earned_count
            }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'reward': reward}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        if course_id:
            cur.execute(
                "SELECT id, name, icon, color, course_id, description, condition, bonuses, created_at "
                "FROM rewards_v2 WHERE course_id = %s ORDER BY created_at DESC",
                (course_id,)
            )
        else:
            cur.execute(
                "SELECT id, name, icon, color, course_id, description, condition, bonuses, created_at "
                "FROM rewards_v2 ORDER BY created_at DESC"
            )
        
        rows = cur.fetchall()
        
        rewards = []
        for row in rows:
            # Считаем сколько пользователей получили эту награду через JSONB
            cur.execute(
                "SELECT COUNT(*) FROM course_progress_v2 WHERE earned_rewards @> %s::jsonb",
                (f'[{row[0]}]',)
            )
            earned_count = cur.fetchone()[0]
            
            rewards.append({
                'id': row[0],
                'name': row[1],
                'icon': row[2],
                'color': row[3],
                'courseId': row[4],
                'description': row[5],
                'condition': row[6],
                'bonuses': row[7] if row[7] else [],
                'createdAt': row[8].isoformat() if row[8] else None,
                'earnedCount': earned_count
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'rewards': rewards}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        try:
            reward_data = RewardCreate(**body_data)
        except ValidationError as e:
            return {
                'statusCode': 422,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Ошибка валидации', 'details': e.errors()}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        bonuses_json = json.dumps(reward_data.bonuses) if reward_data.bonuses else None
        
        cur.execute(
            "INSERT INTO rewards_v2 (name, icon, color, course_id, description, condition, bonuses) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                reward_data.name,
                reward_data.icon,
                reward_data.color,
                reward_data.course_id,
                reward_data.description,
                reward_data.condition,
                bonuses_json
            )
        )
        reward_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': reward_id, 'message': 'Награда создана'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        reward_id = query_params.get('id')
        
        if not reward_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ID награды обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        
        try:
            update_data = RewardUpdate(**body_data)
        except ValidationError as e:
            return {
                'statusCode': 422,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Ошибка валидации', 'details': e.errors()}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        updates = []
        values = []
        
        if update_data.name is not None:
            updates.append("name = %s")
            values.append(update_data.name)
        if update_data.icon is not None:
            updates.append("icon = %s")
            values.append(update_data.icon)
        if update_data.color is not None:
            updates.append("color = %s")
            values.append(update_data.color)
        if update_data.course_id is not None:
            updates.append("course_id = %s")
            values.append(update_data.course_id)
        if update_data.description is not None:
            updates.append("description = %s")
            values.append(update_data.description)
        if update_data.condition is not None:
            updates.append("condition = %s")
            values.append(update_data.condition)
        if update_data.bonuses is not None:
            updates.append("bonuses = %s")
            values.append(json.dumps(update_data.bonuses))
        
        if not updates:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет данных для обновления'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        values.append(reward_id)
        query = f"UPDATE rewards_v2 SET {', '.join(updates)} WHERE id = %s"
        
        cur.execute(query, values)
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Награда обновлена'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE':
        reward_id = query_params.get('id')
        
        if not reward_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ID награды обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM user_rewards_v2 WHERE reward_id = %s", (reward_id,))
        cur.execute("DELETE FROM rewards_v2 WHERE id = %s", (reward_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Награда удалена'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'}, ensure_ascii=False),
        'isBase64Encoded': False
    }