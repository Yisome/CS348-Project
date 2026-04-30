from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection # connection from db

app = Flask(__name__)

# Enable CORS so your React frontend (port 3000) can talk to Flask (port 5000)
CORS(app)

# routes to filter/view based

@app.route('/api/bets/history', methods=['GET'])
def get_bet_history():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Failed to connect to the database."}), 500
        
        cursor = conn.cursor()

        query = """
                SELECT 
                    ub.bet_id,
                    ub.prop_id, -- WE ADDED THIS LINE
                    p.name as player_name,
                    p.team,
                    pl.opponent,
                    pl.sportsbook,
                    pl.stat_category,
                    pl.line,
                    ub.bet_side,
                    ub.wager_amount,
                    ub.odds_taken,
                    ub.potential_payout,
                    ub.status
                FROM UserBets ub
                JOIN PropLines pl ON ub.prop_id = pl.prop_id
                JOIN Players p ON pl.player_id = p.player_id
                ORDER BY ub.bet_id DESC;
            """
        
        cursor.execute(query)
        history_data = cursor.fetchall()
        
        return jsonify(history_data), 200

    except Exception as e:
        print(f"Error fetching bet history: {e}")
        return jsonify({"error": "Failed to fetch bet history"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



@app.route('/api/filters', methods=['GET'])

def get_filters():
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Failed to connect to the database."}), 500
        
        cursor = conn.cursor()

        cursor.execute("SELECT DISTINCT team FROM Players ORDER BY team;")
        raw_teams = cursor.fetchall()

        cursor.execute("SELECT DISTINCT name, team FROM Players ORDER BY name;")
        raw_players = cursor.fetchall()

        cursor.execute("SELECT DISTINCT stat_category FROM PropLines ORDER BY stat_category;")
        raw_categories = cursor.fetchall()

        team_l = [row['team'] for row in raw_teams]
        player_l = [{"name": row['name'], "team": row['team']} for row in raw_players]
        category_l = [row['stat_category'] for row in raw_categories]

        return jsonify({
            "teams": team_l,
            "players": player_l,
            "stat_categories": category_l
        }), 200

    except Exception as e:
        print(f"Error fetching filters: {e}")
        return jsonify({"error": "Failed to fetch filters"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def calculate_l3_hit_rate(cursor, player_id, stat_category, line):
    # Map the string category from PropLines to the actual column in PlayerStats
    category_map = {
        'Points': 'points',
        'Rebounds': 'rebounds',
        'Assists': 'assists',
        'Threes': 'threes_made'
    }
    
    db_column = category_map.get(stat_category)
    if not db_column:
        return None
        
    # Fetch the last 3 games for this player
    cursor.execute(f"""
        SELECT {db_column} 
        FROM PlayerStats 
        WHERE player_id = %s 
        ORDER BY game_date DESC 
        LIMIT 3
    """, (player_id,))
    
    recent_games = cursor.fetchall()
    
    if not recent_games or len(recent_games) == 0:
        return None
        
    # Count how many times they went OVER the line
    hits = sum(1 for game in recent_games if game[db_column] is not None and float(game[db_column]) > float(line))
    
    # Calculate the percentage
    return (hits / len(recent_games)) * 100


    
@app.route('/api/ev-report', methods=['GET'])
def get_ev_report():
    selected_team = request.args.get('team')
    selected_player = request.args.get('player')
    selected_category = request.args.get('stat_category')
    selected_opponent = request.args.get('opponent') # NEW

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Failed to connect to the database."}), 500
            
        cursor = conn.cursor()

        query = """
            SELECT 
                pl.prop_id, 
                p.player_id,
                p.name, 
                p.team,
                pl.opponent,
                pl.sportsbook,
                pl.stat_category, 
                pl.line, 
                pl.over_odds, 
                pl.under_odds,
                mp.true_over_prob
            FROM PropLines pl
            JOIN Players p ON pl.player_id = p.player_id
            LEFT JOIN ModelProjections mp ON pl.prop_id = mp.prop_id
            WHERE 1=1
        """
        
        query_params = []

        if selected_team:
            query += " AND p.team = %s"
            query_params.append(selected_team)

        if selected_player:
            query += " AND p.name = %s"
            query_params.append(selected_player)

        if selected_category:
            query += " AND pl.stat_category = %s"
            query_params.append(selected_category)
            
        if selected_opponent:
            query += " AND pl.opponent = %s"
            query_params.append(selected_opponent)

        cursor.execute(query, tuple(query_params))
        report_data = cursor.fetchall()
        

        #for each row in report data we caluclate last 3 game hit rate and add it to the dict to send to frontend
        rep = []
        for row in report_data:
            row_dict = dict(row) 
            hit_rate = calculate_l3_hit_rate(cursor, row_dict['player_id'], row_dict['stat_category'], row_dict['line'])
            row_dict['l3_hit_rate'] = hit_rate
            rep.append(row_dict)

        return jsonify(rep), 200

    except Exception as e:
        print(f"Error generating EV report: {e}")
        return jsonify({"error": "Failed to generate report"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()




@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        query = """
            SELECT 
                COUNT(*) as total_resolved_bets,
                SUM(CASE WHEN status IN ('Won', 'Lost') THEN 1 ELSE 0 END) as total_decided_bets,
                SUM(CASE WHEN status = 'Won' THEN 1 ELSE 0 END) as total_won_bets,
                COALESCE(SUM(wager_amount), 0) as total_wagered,
                COALESCE(SUM(
                    CASE 
                        WHEN status = 'Won' THEN wager_amount + potential_payout
                        WHEN status = 'Push' THEN wager_amount
                        ELSE 0 
                    END
                ), 0) as total_returned
            FROM UserBets
            WHERE status IN ('Won', 'Lost', 'Push')
        """

        cursor.execute(query)
        data = cursor.fetchone()

        total_wagered = float(data['total_wagered'])
        total_returned = float(data['total_returned'])
        profit = total_returned - total_wagered
        
        roi = 0
        if total_wagered > 0:
            roi = (profit / total_wagered) * 100

        # Calculate Win Percentage (Excluding Pushes)
        total_decided = data['total_decided_bets'] or 0
        total_won = data['total_won_bets'] or 0
        win_percentage = (total_won / total_decided * 100) if total_decided > 0 else 0

        analytics_result = {
            "total_resolved_bets": data['total_resolved_bets'],
            "total_wagered": total_wagered,
            "total_returned": total_returned,
            "profit": profit,
            "roi": roi,
            "win_percentage": win_percentage # NEW
        }

        return jsonify(analytics_result), 200

    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return jsonify({"error": "Failed to fetch analytics"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# insert delete, update routes for bets



@app.route('/api/bets', methods=['POST'])
def add_bet():
    data = request.get_json()
    #get inserted data from frontend
    prop_id = data.get('prop_id')
    bet_side = data.get('bet_side')
    wager_amount = data.get('wager_amount')
    odds_taken = data.get('odds_taken')
    potential_payout = data.get('potential_payout')

    #check for all fields
    if not all([prop_id, bet_side, wager_amount, odds_taken, potential_payout]):
        return jsonify({"error": "Missing required fields"}), 400

    #Input Sanitization and Validation
    try:
        prop_id = int(prop_id)
        wager_amount = float(wager_amount)
        odds_taken = int(odds_taken)
        potential_payout = float(potential_payout)
    except ValueError:
        return jsonify({"error": "Invalid input types"}), 400

    # Validate bet_side
    if bet_side not in ['Over', 'Under']:
        return jsonify({"error": "Invalid bet side"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Failed to connect to the database."}), 500
        
        cursor = conn.cursor()
        
        #Statements to prevent SQL Injection
        insert_query = """
            INSERT INTO UserBets (prop_id, bet_side, wager_amount, odds_taken, potential_payout)
            VALUES (%s, %s, %s, %s, %s)
        """

        params = (prop_id, bet_side, wager_amount, odds_taken, potential_payout)

        cursor.execute(insert_query, params)
        conn.commit()

    
        return jsonify({"message": "Bet added successfully!"}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error adding bet: {e}")
        return jsonify({"error": "Failed to add bet"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close() 




@app.route('/api/bets/<int:bet_id>', methods=['PUT'])
def update_bet(bet_id):

    # Grab the new status from the incoming JSON
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({"error": "Missing 'status' field in request body"}), 400
        
    if new_status not in ['Won', 'Lost', 'Push', 'Pending']:
        return jsonify({"error": "Invalid status value"}), 400
    
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Failed to connect to the database."}), 500
        
        cursor = conn.cursor()

        update_query = """
            UPDATE UserBets
            SET status = %s
            WHERE bet_id = %s
        """

        params = (new_status, bet_id)

        cursor.execute(update_query, params)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Bet not found"}), 404

        return jsonify({"message": f"Bet ID {bet_id} updated successfully!"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating bet: {e}")
        return jsonify({"error": "Failed to update bet"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()




@app.route('/api/bets/<int:bet_id>', methods=['DELETE'])
def delete_bet(bet_id):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Failed to connect to the database."}), 500
        
        cursor = conn.cursor()

        delete_query = """
            DELETE FROM UserBets
            WHERE bet_id = %s
        """

        cursor.execute(delete_query, (bet_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Bet not found"}), 404

        return jsonify({"message": f"Delete bet route for ID {bet_id} is working!"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error deleting bet: {e}")
        return jsonify({"error": "Failed to delete bet"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



if __name__ == '__main__':
    app.run(debug=True, port=5000)