import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Управление матрицами: покупка тарифа, просмотр матрицы, начисление выплат"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')

    conn = get_db()
    cur = conn.cursor()

    if action == 'get_tariffs':
        cur.execute("SELECT id, name, slug, entry_price FROM tariffs ORDER BY entry_price")
        rows = cur.fetchall()
        tariffs = [{'id': r[0], 'name': r[1], 'slug': r[2], 'price': float(r[3])} for r in rows]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'tariffs': tariffs})}

    elif action == 'buy_tariff':
        user_id = body.get('user_id')
        tariff_id = body.get('tariff_id')

        cur.execute("SELECT entry_price FROM tariffs WHERE id = %s", (tariff_id,))
        tariff = cur.fetchone()
        if not tariff:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Тариф не найден'})}

        cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user or float(user[0]) < float(tariff[0]):
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Недостаточно средств'})}

        cur.execute("SELECT id FROM user_matrices WHERE user_id = %s AND tariff_id = %s AND status = 'active'", (user_id, tariff_id))
        if cur.fetchone():
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Тариф уже активен'})}

        cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (tariff[0], user_id))
        cur.execute(
            "INSERT INTO transactions (user_id, type, amount, status, description) VALUES (%s, 'buy_tariff', %s, 'completed', %s)",
            (user_id, tariff[0], f'Покупка тарифа {tariff_id}')
        )
        cur.execute(
            "INSERT INTO user_matrices (user_id, tariff_id, level_number, status) VALUES (%s, %s, 1, 'active') RETURNING id",
            (user_id, tariff_id)
        )
        matrix_id = cur.fetchone()[0]

        # Начисляем спонсору за вход нового участника
        cur.execute("SELECT referred_by FROM users WHERE id = %s", (user_id,))
        ref_row = cur.fetchone()
        if ref_row and ref_row[0]:
            cur.execute("SELECT payout_per_slot FROM matrix_levels WHERE tariff_id = %s AND level_number = 1", (tariff_id,))
            payout_row = cur.fetchone()
            if payout_row:
                payout = float(payout_row[0])
                cur.execute("UPDATE users SET balance = balance + %s, total_earned = total_earned + %s WHERE id = %s", (payout, payout, ref_row[0]))
                cur.execute(
                    "INSERT INTO transactions (user_id, type, amount, status, description) VALUES (%s, 'matrix_payout', %s, 'completed', %s)",
                    (ref_row[0], payout, f'Выплата за уровень 1 от пользователя {user_id}')
                )

        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'matrix_id': matrix_id, 'success': True})}

    elif action == 'get_my_matrices':
        user_id = body.get('user_id')
        cur.execute("""
            SELECT um.id, t.name, t.slug, t.entry_price, um.level_number, um.status, um.slots_filled, um.created_at
            FROM user_matrices um
            JOIN tariffs t ON um.tariff_id = t.id
            WHERE um.user_id = %s
            ORDER BY um.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        matrices = [{
            'id': r[0], 'tariff_name': r[1], 'tariff_slug': r[2],
            'entry_price': float(r[3]), 'level': r[4], 'status': r[5],
            'slots_filled': r[6], 'created_at': str(r[7])
        } for r in rows]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'matrices': matrices})}

    elif action == 'get_matrix_detail':
        matrix_id = body.get('matrix_id')
        cur.execute("""
            SELECT um.id, um.user_id, um.tariff_id, um.level_number, um.status, um.slots_filled,
                   t.name, t.entry_price
            FROM user_matrices um JOIN tariffs t ON um.tariff_id = t.id
            WHERE um.id = %s
        """, (matrix_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Матрица не найдена'})}

        cur.execute("""
            SELECT ml.level_number, ml.payout_per_slot, ml.slots_count
            FROM matrix_levels ml WHERE ml.tariff_id = %s ORDER BY ml.level_number
        """, (row[2],))
        levels = [{'level': r[0], 'payout': float(r[1]), 'slots': r[2]} for r in cur.fetchall()]

        cur.execute("""
            SELECT ms.slot_position, u.name, ms.filled_at
            FROM matrix_slots ms JOIN users u ON ms.filled_by_user_id = u.id
            WHERE ms.matrix_id = %s ORDER BY ms.slot_position
        """, (matrix_id,))
        slots = [{'position': r[0], 'name': r[1], 'filled_at': str(r[2])} for r in cur.fetchall()]

        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'matrix': {'id': row[0], 'level': row[3], 'status': row[4], 'slots_filled': row[5], 'tariff_name': row[6], 'entry_price': float(row[7])},
            'levels': levels, 'slots': slots
        })}

    cur.close()
    conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
