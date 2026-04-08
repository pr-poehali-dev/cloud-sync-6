import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Управление балансом: пополнение, вывод, история транзакций"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')

    conn = get_db()
    cur = conn.cursor()

    if action == 'get_balance':
        user_id = body.get('user_id')
        cur.execute("SELECT balance, total_earned FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Не найден'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'balance': float(row[0]), 'total_earned': float(row[1])})}

    elif action == 'request_withdrawal':
        user_id = body.get('user_id')
        amount = float(body.get('amount', 0))
        sbp_phone = body.get('sbp_phone', '').strip()
        sbp_bank = body.get('sbp_bank', '').strip()

        if amount <= 0 or not sbp_phone:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите сумму и номер телефона СБП'})}

        cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row or float(row[0]) < amount:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Недостаточно средств'})}

        cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (amount, user_id))
        cur.execute(
            "INSERT INTO withdrawal_requests (user_id, amount, sbp_phone, sbp_bank, status) VALUES (%s, %s, %s, %s, 'pending') RETURNING id",
            (user_id, amount, sbp_phone, sbp_bank)
        )
        req_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO transactions (user_id, type, amount, status, description) VALUES (%s, 'withdrawal', %s, 'pending', %s)",
            (user_id, amount, f'Заявка на вывод #{req_id}')
        )
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'request_id': req_id, 'success': True})}

    elif action == 'get_transactions':
        user_id = body.get('user_id')
        cur.execute("""
            SELECT id, type, amount, status, description, created_at
            FROM transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT 50
        """, (user_id,))
        rows = cur.fetchall()
        txs = [{'id': r[0], 'type': r[1], 'amount': float(r[2]), 'status': r[3], 'description': r[4], 'created_at': str(r[5])} for r in rows]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'transactions': txs})}

    elif action == 'topup_balance':
        user_id = body.get('user_id')
        amount = float(body.get('amount', 0))
        payment_id = body.get('payment_id', '')

        if amount <= 0:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверная сумма'})}

        cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (amount, user_id))
        cur.execute(
            "INSERT INTO transactions (user_id, type, amount, status, description, payment_id) VALUES (%s, 'topup', %s, 'completed', 'Пополнение баланса', %s)",
            (user_id, amount, payment_id)
        )
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

    elif action == 'get_referrals':
        user_id = body.get('user_id')
        cur.execute("""
            SELECT u.name, u.created_at,
                   (SELECT COUNT(*) FROM user_matrices um WHERE um.user_id = u.id) as matrix_count
            FROM users u WHERE u.referred_by = %s ORDER BY u.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        referrals = [{'name': r[0], 'joined': str(r[1]), 'matrices': r[2]} for r in rows]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'referrals': referrals, 'count': len(referrals)})}

    cur.close(); conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
