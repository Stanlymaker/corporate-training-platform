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

class CreateTestRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    passScore: int = Field(default=70, ge=0, le=100)
    timeLimit: int = Field(default=60, ge=1)
    attempts: int = Field(default=3, ge=1)

class UpdateTestRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    passScore: Optional[int] = Field(None, ge=0, le=100)
    timeLimit: Optional[int] = Field(None, ge=1)
    attempts: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, pattern='^(draft|published)$')

class CreateQuestionRequest(BaseModel):
    testId: str = Field(..., min_length=1)
    type: str = Field(..., pattern='^(single|multiple|text|matching)$')
    text: str = Field(..., min_length=1)
    options: Optional[list] = None
    correctAnswer: Any
    points: int = Field(default=1, ge=1)
    order: int = Field(..., ge=0)
    matchingPairs: Optional[list] = None
    textCheckType: Optional[str] = Field(None, pattern='^(manual|automatic)$')

class UpdateQuestionRequest(BaseModel):
    type: Optional[str] = Field(None, pattern='^(single|multiple|text|matching)$')
    text: Optional[str] = Field(None, min_length=1)
    options: Optional[list] = None
    correctAnswer: Optional[Any] = None
    points: Optional[int] = Field(None, ge=1)
    order: Optional[int] = Field(None, ge=0)
    matchingPairs: Optional[list] = None
    textCheckType: Optional[str] = Field(None, pattern='^(manual|automatic)$')

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

def format_test_response(test_row: tuple) -> Dict[str, Any]:
    return {
        'id': test_row[0],
        'displayId': test_row[1],
        'courseId': test_row[2],
        'lessonId': test_row[3],
        'title': test_row[4],
        'description': test_row[5],
        'passScore': test_row[6],
        'timeLimit': test_row[7],
        'attempts': test_row[8],
        'questionsCount': test_row[9],
        'status': test_row[10],
        'createdAt': test_row[11].isoformat() if test_row[11] else None,
        'updatedAt': test_row[12].isoformat() if test_row[12] else None,
    }

def format_question_response(question_row: tuple) -> Dict[str, Any]:
    return {
        'id': question_row[0],
        'testId': question_row[1],
        'type': question_row[2],
        'text': question_row[3],
        'options': question_row[4],
        'correctAnswer': question_row[5],
        'points': question_row[6],
        'order': question_row[7],
        'matchingPairs': question_row[8],
        'textCheckType': question_row[9],
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление тестами и вопросами
    GET ?id=x - один тест
    GET ?testId=x&action=questions - вопросы теста
    POST - создать тест (админ)
    POST ?action=question - создать вопрос (админ)
    PUT ?id=x - обновить тест (админ)
    PUT ?action=question&questionId=x - обновить вопрос (админ)
    DELETE ?id=x - удалить тест и его вопросы (админ)
    DELETE ?action=question&questionId=x - удалить вопрос (админ)
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
    test_id = query_params.get('id')
    course_id = query_params.get('courseId')
    test_id_param = query_params.get('testId')
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
    
    if method == 'GET' and action == 'questions' and test_id_param:
        cur.execute(
            "SELECT id, test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type FROM questions WHERE test_id = %s ORDER BY \"order\"",
            (test_id_param,)
        )
        questions = cur.fetchall()
        questions_list = [format_question_response(q) for q in questions]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'questions': questions_list}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET' and test_id:
        cur.execute(
            "SELECT id, display_id, course_id, lesson_id, title, description, pass_score, time_limit, "
            "attempts, questions_count, status, created_at, updated_at FROM tests WHERE display_id = %s",
            (int(test_id),)
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
        
        test_data = format_test_response(test)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'test': test_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        cur.execute(
            "SELECT id, display_id, course_id, lesson_id, title, description, pass_score, time_limit, "
            "attempts, questions_count, status, created_at, updated_at "
            "FROM tests ORDER BY display_id DESC"
        )
        tests = cur.fetchall()
        tests_list = [format_test_response(test) for test in tests]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'tests': tests_list}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'question':
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
        question_req = CreateQuestionRequest(**body_data)
        
        new_question_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        cur.execute(
            "INSERT INTO questions (id, test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, test_id, type, text, options, correct_answer, points, \"order\", matching_pairs, text_check_type",
            (new_question_id, question_req.testId, question_req.type, question_req.text,
             json.dumps(question_req.options) if question_req.options else None,
             json.dumps(question_req.correctAnswer),
             question_req.points, question_req.order,
             json.dumps(question_req.matchingPairs) if question_req.matchingPairs else None,
             question_req.textCheckType, now)
        )
        new_question = cur.fetchone()
        
        cur.execute(
            "UPDATE tests SET questions_count = questions_count + 1, updated_at = %s WHERE id = %s",
            (now, question_req.testId)
        )
        conn.commit()
        
        question_data = format_question_response(new_question)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'question': question_data}, ensure_ascii=False),
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
        create_req = CreateTestRequest(**body_data)
        
        new_test_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        cur.execute(
            "INSERT INTO tests (id, course_id, lesson_id, title, description, pass_score, time_limit, "
            "attempts, questions_count, status, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, display_id, course_id, lesson_id, title, description, pass_score, time_limit, attempts, "
            "questions_count, status, created_at, updated_at",
            (new_test_id, 'temp', None, create_req.title,
             create_req.description, create_req.passScore, create_req.timeLimit, create_req.attempts,
             0, 'draft', now, now)
        )
        new_test = cur.fetchone()
        conn.commit()
        
        test_data = format_test_response(new_test)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'test': test_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and test_id:
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
        update_req = UpdateTestRequest(**body_data)
        
        update_fields = []
        update_values = []
        
        if update_req.title is not None:
            update_fields.append('title = %s')
            update_values.append(update_req.title)
        if update_req.description is not None:
            update_fields.append('description = %s')
            update_values.append(update_req.description)
        if update_req.passScore is not None:
            update_fields.append('pass_score = %s')
            update_values.append(update_req.passScore)
        if update_req.timeLimit is not None:
            update_fields.append('time_limit = %s')
            update_values.append(update_req.timeLimit)
        if update_req.attempts is not None:
            update_fields.append('attempts = %s')
            update_values.append(update_req.attempts)
        if update_req.status is not None:
            update_fields.append('status = %s')
            update_values.append(update_req.status)
        
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
        update_values.append(int(test_id))
        
        query = f"UPDATE tests SET {', '.join(update_fields)} WHERE display_id = %s RETURNING id, display_id, course_id, lesson_id, title, description, pass_score, time_limit, attempts, questions_count, status, created_at, updated_at"
        
        cur.execute(query, update_values)
        updated_test = cur.fetchone()
        conn.commit()
        
        if not updated_test:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тест не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        test_data = format_test_response(updated_test)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'test': test_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'PUT' and action == 'question':
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
        
        question_id = query_params.get('questionId')
        if not question_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Не указан ID вопроса'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        update_req = UpdateQuestionRequest(**body_data)
        
        update_fields = []
        update_values = []
        
        if update_req.type is not None:
            update_fields.append('type = %s')
            update_values.append(update_req.type)
        if update_req.text is not None:
            update_fields.append('text = %s')
            update_values.append(update_req.text)
        if update_req.options is not None:
            update_fields.append('options = %s')
            update_values.append(json.dumps(update_req.options))
        if update_req.correctAnswer is not None:
            update_fields.append('correct_answer = %s')
            update_values.append(json.dumps(update_req.correctAnswer))
        if update_req.points is not None:
            update_fields.append('points = %s')
            update_values.append(update_req.points)
        if update_req.order is not None:
            update_fields.append('"order" = %s')
            update_values.append(update_req.order)
        if update_req.matchingPairs is not None:
            update_fields.append('matching_pairs = %s')
            update_values.append(json.dumps(update_req.matchingPairs))
        if update_req.textCheckType is not None:
            update_fields.append('text_check_type = %s')
            update_values.append(update_req.textCheckType)
        
        if not update_fields:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет полей для обновления'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        update_values.append(question_id)
        query = f"UPDATE questions SET {', '.join(update_fields)} WHERE id = %s RETURNING id, test_id, type, text, options, correct_answer, points, \"order\", matching_pairs, text_check_type"
        
        cur.execute(query, update_values)
        updated_question = cur.fetchone()
        conn.commit()
        
        if not updated_question:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Вопрос не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        question_data = format_question_response(updated_question)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'question': question_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE' and action == 'question':
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
        
        question_id = query_params.get('questionId')
        if not question_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Не указан ID вопроса'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        cur.execute("SELECT test_id FROM questions WHERE id = %s", (question_id,))
        question_row = cur.fetchone()
        
        if question_row:
            test_id_for_update = question_row[0]
            cur.execute("DELETE FROM questions WHERE id = %s", (question_id,))
            cur.execute(
                "UPDATE tests SET questions_count = GREATEST(questions_count - 1, 0), updated_at = %s WHERE id = %s",
                (datetime.utcnow(), test_id_for_update)
            )
        
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Вопрос удален'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE' and test_id:
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
        
        cur.execute("SELECT id FROM tests WHERE display_id = %s", (int(test_id),))
        test_row = cur.fetchone()
        if test_row:
            actual_test_id = test_row[0]
            cur.execute("DELETE FROM questions WHERE test_id = %s", (actual_test_id,))
            cur.execute("DELETE FROM tests WHERE display_id = %s", (int(test_id),))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Тест успешно удален'}, ensure_ascii=False),
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