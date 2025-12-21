import json
import os
import psycopg2
import jwt
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
    testId: int = Field(..., ge=1)
    type: str = Field(..., pattern='^(single|multiple|text|matching)$')
    text: str = Field(..., min_length=1)
    options: Optional[list] = None
    correctAnswer: Any
    points: int = Field(default=1, ge=1)
    order: int = Field(..., ge=0)
    matchingPairs: Optional[list] = None
    textCheckType: Optional[str] = Field(None, pattern='^(manual|automatic)$')
    imageUrl: Optional[str] = None

class UpdateQuestionRequest(BaseModel):
    type: Optional[str] = Field(None, pattern='^(single|multiple|text|matching)$')
    text: Optional[str] = Field(None, min_length=1)
    options: Optional[list] = None
    correctAnswer: Optional[Any] = None
    points: Optional[int] = Field(None, ge=1)
    order: Optional[int] = Field(None, ge=0)
    matchingPairs: Optional[list] = None
    textCheckType: Optional[str] = Field(None, pattern='^(manual|automatic)$')
    imageUrl: Optional[str] = None

class CheckTestRequest(BaseModel):
    testId: int = Field(..., ge=1)
    lessonId: str = Field(..., min_length=1)
    answers: Dict[str, Any] = Field(...)

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
        'courseId': test_row[1],
        'lessonId': test_row[2],
        'title': test_row[3],
        'description': test_row[4],
        'passScore': test_row[5],
        'timeLimit': test_row[6],
        'attempts': test_row[7],
        'questionsCount': test_row[8],
        'status': test_row[9],
        'createdAt': test_row[10].isoformat() if test_row[10] else None,
        'updatedAt': test_row[11].isoformat() if test_row[11] else None,
    }

def format_question_response(question_row: tuple, hide_correct_answer: bool = False) -> Dict[str, Any]:
    question = {
        'id': question_row[0],
        'testId': question_row[1],
        'type': question_row[2],
        'question': question_row[3],  # Renamed from 'text' to 'question' for frontend
        'options': question_row[4],
        'points': question_row[6],
        'order': question_row[7],
        'matchingPairs': question_row[8],
        'textCheckType': question_row[9],
        'imageUrl': question_row[10] if len(question_row) > 10 else None,
    }
    
    # Добавляем correctAnswer только для админов
    if not hide_correct_answer:
        question['correctAnswer'] = question_row[5]
    
    return question

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление тестами и вопросами
    GET ?id=x - один тест
    GET ?testId=x&action=questions - вопросы теста
    GET ?action=results&lessonId=x - результаты теста пользователя
    POST - создать тест (админ)
    POST ?action=question - создать вопрос (админ)
    POST ?action=check - проверить ответы теста (студент)
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
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id-Override',
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
    
    if method == 'GET' and action == 'results':
        lesson_id = query_params.get('lessonId')
        if not lesson_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'lessonId обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Для админов разрешаем просмотр результатов других пользователей
        user_id_override = headers.get('X-User-Id-Override') or headers.get('x-user-id-override')
        if user_id_override and payload.get('role') == 'admin':
            user_id = int(user_id_override)
        else:
            user_id = payload.get('user_id')
        
        # Получаем последний результат пользователя для этого конкретного урока
        cur.execute(
            "SELECT id, user_id, test_id, lesson_id, course_id, score, earned_points, "
            "total_points, passed, answers, results, completed_at "
            "FROM t_p8600777_corporate_training_p.test_results WHERE user_id = %s AND lesson_id = %s "
            "ORDER BY completed_at DESC LIMIT 1",
            (user_id, lesson_id)
        )
        result_row = cur.fetchone()
        
        if not result_row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Результаты не найдены'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        result_data = {
            'id': result_row[0],
            'userId': result_row[1],
            'testId': result_row[2],
            'lessonId': result_row[3],
            'courseId': result_row[4],
            'score': result_row[5],
            'earnedPoints': result_row[6],
            'totalPoints': result_row[7],
            'passed': result_row[8],
            'answers': result_row[9],
            'results': result_row[10],
            'completedAt': result_row[11].isoformat() if result_row[11] else None
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'result': result_data}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    if method == 'GET' and action == 'questions' and test_id_param:
        test_id_int = int(test_id_param)
        
        cur.execute(
            "SELECT id, test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type, image_url FROM questions_v2 WHERE test_id = %s ORDER BY \"order\"",
            (test_id_int,)
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
            "SELECT id, course_id, lesson_id, title, description, pass_score, time_limit, "
            "attempts, questions_count, status, created_at, updated_at FROM tests_v2 WHERE id = %s",
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
        
        # Загружаем вопросы теста
        cur.execute(
            "SELECT id, test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type, image_url FROM questions_v2 WHERE test_id = %s ORDER BY \"order\"",
            (int(test_id),)
        )
        questions = cur.fetchall()
        
        # Скрываем правильные ответы для студентов
        is_student = payload.get('role') == 'student'
        test_data['questions'] = [format_question_response(q, hide_correct_answer=is_student) for q in questions]
        
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
            "SELECT id, course_id, lesson_id, title, description, pass_score, time_limit, "
            "attempts, questions_count, status, created_at, updated_at "
            "FROM tests_v2 ORDER BY id DESC"
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
    
    if method == 'POST' and action == 'check':
        # Проверка ответов теста
        body_data = json.loads(event.get('body', '{}'))
        
        try:
            check_req = CheckTestRequest(**body_data)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Неверные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Получаем вопросы теста с правильными ответами
        cur.execute(
            "SELECT id, test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type, image_url FROM questions_v2 WHERE test_id = %s ORDER BY \"order\"",
            (check_req.testId,)
        )
        questions = cur.fetchall()
        
        if not questions:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тест не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        earned_points = 0
        total_points = 0
        results = []
        
        print(f'=== DEBUG: Проверка теста {check_req.testId} ===')
        print(f'Ответы пользователя: {check_req.answers}')
        
        for q in questions:
            question_id = str(q[0])
            question_type = q[2]
            correct_answer = q[5]
            points = q[6]
            matching_pairs = q[8]
            
            total_points += points
            user_answer = check_req.answers.get(question_id)
            is_correct = False
            
            print(f'Вопрос {question_id} ({question_type}):')
            print(f'  Ответ пользователя: {user_answer} (тип: {type(user_answer).__name__})')
            print(f'  Правильный ответ: {correct_answer} (тип: {type(correct_answer).__name__})')
            print(f'  Баллы: {points}')
            
            if question_type == 'single':
                # Для single choice сравниваем числовые индексы
                is_correct = user_answer == correct_answer
            
            elif question_type == 'multiple':
                # Для multiple choice сравниваем массивы
                if isinstance(correct_answer, list) and isinstance(user_answer, list):
                    is_correct = sorted(correct_answer) == sorted(user_answer)
            
            elif question_type == 'matching':
                # Для matching проверяем порядок правых элементов
                if matching_pairs and isinstance(user_answer, list):
                    correct_order = [p['right'] for p in matching_pairs]
                    is_correct = user_answer == correct_order
            
            elif question_type == 'text':
                # Для текстовых вопросов сравниваем с правильным ответом (если задан)
                if isinstance(correct_answer, str) and isinstance(user_answer, str):
                    is_correct = user_answer.strip().lower() == correct_answer.strip().lower()
                else:
                    is_correct = False
            
            if is_correct:
                earned_points += points
            
            results.append({
                'questionId': question_id,
                'isCorrect': is_correct,
                'points': points if is_correct else 0
            })
        
        score = round((earned_points / total_points * 100)) if total_points > 0 else 0
        
        # Используем переданный lessonId и получаем course_id из таблицы lessons
        cur.execute(
            "SELECT course_id FROM t_p8600777_corporate_training_p.lessons_v2 WHERE id = %s LIMIT 1",
            (check_req.lessonId,)
        )
        lesson_data = cur.fetchone()
        
        if not lesson_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Урок не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        course_id_val = lesson_data[0]
        
        # Получаем passing score из теста
        cur.execute("SELECT pass_score FROM t_p8600777_corporate_training_p.tests_v2 WHERE id = %s", (check_req.testId,))
        test_info = cur.fetchone()
        passing_score = test_info[0] if test_info else 70
        passed = score >= passing_score
        
        # Сохраняем результат теста
        user_id = payload.get('user_id')
        if user_id and course_id_val:
            cur.execute(
                "INSERT INTO t_p8600777_corporate_training_p.test_results (user_id, test_id, lesson_id, course_id, score, "
                "earned_points, total_points, passed, answers, results, completed_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())",
                (
                    user_id,
                    check_req.testId,
                    check_req.lessonId,
                    course_id_val,
                    score,
                    earned_points,
                    total_points,
                    passed,
                    json.dumps(check_req.answers),
                    json.dumps(results)
                )
            )
            conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'score': score,
                'earnedPoints': earned_points,
                'totalPoints': total_points,
                'results': results
            }, ensure_ascii=False),
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
        
        try:
            body = json.loads(event.get('body', '{}'))
            request = CreateQuestionRequest(**body)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        cur.execute("SELECT id FROM tests_v2 WHERE id = %s", (request.testId,))
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
        
        cur.execute(
            "INSERT INTO questions_v2 (test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                request.testId,
                request.type,
                request.text,
                json.dumps(request.options) if request.options else None,
                json.dumps(request.correctAnswer),
                request.points,
                request.order,
                json.dumps(request.matchingPairs) if request.matchingPairs else None,
                request.textCheckType,
                request.imageUrl
            )
        )
        question_id = cur.fetchone()[0]
        
        # Update questions_count in tests_v2
        cur.execute(
            "UPDATE tests_v2 SET questions_count = questions_count + 1, updated_at = NOW() WHERE id = %s",
            (request.testId,)
        )
        
        conn.commit()
        
        cur.execute(
            "SELECT id, test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type FROM questions_v2 WHERE id = %s",
            (question_id,)
        )
        question = cur.fetchone()
        question_data = format_question_response(question)
        
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
        
        try:
            body = json.loads(event.get('body', '{}'))
            request = CreateTestRequest(**body)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO tests_v2 (title, description, pass_score, time_limit, attempts, status) "
            "VALUES (%s, %s, %s, %s, %s, 'draft') "
            "RETURNING id, course_id, lesson_id, title, description, pass_score, time_limit, attempts, "
            "questions_count, status, created_at, updated_at",
            (
                request.title,
                request.description,
                request.passScore,
                request.timeLimit,
                request.attempts
            )
        )
        
        test = cur.fetchone()
        test_data = format_test_response(test)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
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
                'body': json.dumps({'error': 'questionId обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        try:
            body = json.loads(event.get('body', '{}'))
            request = UpdateQuestionRequest(**body)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Check if question exists
        cur.execute("SELECT id FROM questions_v2 WHERE id = %s", (question_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Вопрос не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Build update query
        updates = []
        params = []
        
        if request.type is not None:
            updates.append("type = %s")
            params.append(request.type)
        if request.text is not None:
            updates.append("text = %s")
            params.append(request.text)
        if request.options is not None:
            updates.append("options = %s")
            params.append(json.dumps(request.options))
        if request.correctAnswer is not None:
            updates.append("correct_answer = %s")
            params.append(json.dumps(request.correctAnswer))
        if request.points is not None:
            updates.append("points = %s")
            params.append(request.points)
        if request.order is not None:
            updates.append('"order" = %s')
            params.append(request.order)
        if request.matchingPairs is not None:
            updates.append("matching_pairs = %s")
            params.append(json.dumps(request.matchingPairs))
        if request.textCheckType is not None:
            updates.append("text_check_type = %s")
            params.append(request.textCheckType)
        if request.imageUrl is not None:
            updates.append("image_url = %s")
            params.append(request.imageUrl)
        
        if not updates:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет данных для обновления'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        params.append(question_id)
        query = f"UPDATE questions_v2 SET {', '.join(updates)} WHERE id = %s"
        cur.execute(query, params)
        
        # Update test updated_at
        cur.execute(
            "UPDATE tests_v2 SET updated_at = NOW() WHERE id = (SELECT test_id FROM questions_v2 WHERE id = %s)",
            (question_id,)
        )
        
        conn.commit()
        
        cur.execute(
            "SELECT id, test_id, type, text, options, correct_answer, points, \"order\", "
            "matching_pairs, text_check_type FROM questions_v2 WHERE id = %s",
            (question_id,)
        )
        question = cur.fetchone()
        question_data = format_question_response(question)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'question': question_data}, ensure_ascii=False),
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
        
        try:
            body = json.loads(event.get('body', '{}'))
            request = UpdateTestRequest(**body)
        except Exception as e:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Некорректные данные: {str(e)}'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Check if test exists - use INTEGER id
        cur.execute("SELECT id FROM tests_v2 WHERE id = %s", (int(test_id),))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тест не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Build update query
        updates = []
        params = []
        
        if request.title is not None:
            updates.append("title = %s")
            params.append(request.title)
        if request.description is not None:
            updates.append("description = %s")
            params.append(request.description)
        if request.passScore is not None:
            updates.append("pass_score = %s")
            params.append(request.passScore)
        if request.timeLimit is not None:
            updates.append("time_limit = %s")
            params.append(request.timeLimit)
        if request.attempts is not None:
            updates.append("attempts = %s")
            params.append(request.attempts)
        if request.status is not None:
            updates.append("status = %s")
            params.append(request.status)
        
        if not updates:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет данных для обновления'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        updates.append("updated_at = NOW()")
        params.append(int(test_id))
        
        query = f"UPDATE tests_v2 SET {', '.join(updates)} WHERE id = %s " \
                f"RETURNING id, course_id, lesson_id, title, description, pass_score, time_limit, attempts, " \
                f"questions_count, status, created_at, updated_at"
        
        cur.execute(query, params)
        test = cur.fetchone()
        test_data = format_test_response(test)
        
        # Если тест меняется на черновик, меняем связанные опубликованные курсы на черновик
        if request.status == 'draft':
            # Находим все уроки, связанные с этим тестом
            cur.execute(
                "SELECT DISTINCT course_id FROM lessons_v2 WHERE test_id = %s",
                (int(test_id),)
            )
            course_ids = [row[0] for row in cur.fetchall()]
            
            # Меняем статус опубликованных курсов на черновик
            if course_ids:
                placeholders = ','.join(['%s'] * len(course_ids))
                cur.execute(
                    f"UPDATE courses_v2 SET status = 'draft', published = false, updated_at = NOW() "
                    f"WHERE id IN ({placeholders}) AND status = 'published'",
                    course_ids
                )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'test': test_data}, ensure_ascii=False),
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
                'body': json.dumps({'error': 'questionId обязателен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Get test_id before deleting
        cur.execute("SELECT test_id FROM questions_v2 WHERE id = %s", (question_id,))
        result = cur.fetchone()
        if not result:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Вопрос не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        test_id_for_update = result[0]
        
        cur.execute("DELETE FROM questions_v2 WHERE id = %s", (question_id,))
        
        # Update questions_count
        cur.execute(
            "UPDATE tests_v2 SET questions_count = questions_count - 1, updated_at = NOW() WHERE id = %s",
            (test_id_for_update,)
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
        
        # Check if test exists - use INTEGER id
        cur.execute("SELECT id FROM tests_v2 WHERE id = %s", (int(test_id),))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тест не найден'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        # Delete questions first
        cur.execute("DELETE FROM questions_v2 WHERE test_id = %s", (int(test_id),))
        
        # Delete test
        cur.execute("DELETE FROM tests_v2 WHERE id = %s", (int(test_id),))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Тест и его вопросы удалены'}, ensure_ascii=False),
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