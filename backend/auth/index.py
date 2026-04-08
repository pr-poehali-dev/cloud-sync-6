import json
import os
import hashlib
import random
import string
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_referral_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def handler(event: dict, context) -> dict:
    """Регистрация и вход пользователей"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')

    conn = get_db()
    cur = conn.cursor()

    if action == 'register':
        name = body.get('name', '').strip()
        password = body.get('password', '').strip()
        ref_code = body.get('ref_code', '').strip()

        if not name or not password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Имя и пароль обязательны'})}

        referrer_id = None
        if ref_code:
            cur.execute("SELECT id FROM users WHERE referral_code = %s", (ref_code,))
            row = cur.fetchone()
            if row:
                referrer_id = row[0]

        my_code = generate_referral_code()
        cur.execute(
            "INSERT INTO users (name, password_hash, referral_code, referred_by) VALUES (%s, %s, %s, %s) RETURNING id",
            (name, hash_password(password), my_code, referrer_id)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'user_id': user_id, 'referral_code': my_code, 'name': name})}

    elif action == 'login':
        name = body.get('name', '').strip()
        password = body.get('password', '').strip()

        cur.execute("SELECT id, name, referral_code, balance, total_earned FROM users WHERE name = %s AND password_hash = %s", (name, hash_password(password)))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверное имя или пароль'})}

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'user_id': row[0], 'name': row[1], 'referral_code': row[2],
            'balance': float(row[3]), 'total_earned': float(row[4])
        })}

    elif action == 'get_user':
        user_id = body.get('user_id')
        cur.execute("SELECT id, name, referral_code, balance, total_earned, created_at FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Пользователь не найден'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'user_id': row[0], 'name': row[1], 'referral_code': row[2],
            'balance': float(row[3]), 'total_earned': float(row[4]), 'created_at': str(row[5])
        })}

    cur.close()
    conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
