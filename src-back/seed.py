import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def seed_database():
    print("Connecting to Neon database...")
    conn = None
    cursor = None
    
    try:
        conn = psycopg2.connect(os.environ.get("DATABASE_URL"))
        cursor = conn.cursor()

        # 1. Clear existing data to prevent duplicate primary key errors
        print("Clearing old data...")
        cursor.execute("TRUNCATE TABLE UserBets, ModelProjections, PropLines, Players RESTART IDENTITY CASCADE;")

        # 2. Insert Players (Featuring the Bulls and some NBA stars)
        print("Inserting Players...")
        players = [
            (1, 'Coby White', 'CHI'),
            (2, 'Zach LaVine', 'CHI'),
            (3, 'Nikola Vucevic', 'CHI'),
            (4, 'Ayo Dosunmu', 'CHI'),
            (5, 'LeBron James', 'LAL'),
            (6, 'Stephen Curry', 'GSW'),
            (7, 'Nikola Jokic', 'DEN')
        ]
        cursor.executemany("INSERT INTO Players (player_id, name, team) VALUES (%s, %s, %s);", players)

        # 3. Insert Prop Lines
       # 3. Insert Prop Lines
        print("Inserting Prop Lines...")
        props = [
            # prop_id, player_id, game_date, opponent, sportsbook, category, line, over_odds, under_odds
            (1, 1, '2026-03-26', 'LAL', 'DraftKings', 'Points', 21.5, -110, -110),
            (2, 1, '2026-03-26', 'LAL', 'FanDuel', 'Points', 21.5, -115, -105),
            (3, 2, '2026-03-26', 'GSW', 'BetMGM', 'Threes', 2.5, +120, -140),
            (4, 2, '2026-03-26', 'GSW', 'DraftKings', 'Threes', 2.5, +110, -135),
            (5, 3, '2026-03-26', 'DEN', 'DraftKings', 'Rebounds', 10.5, -105, -115),
            (6, 4, '2026-03-26', 'LAL', 'FanDuel', 'Assists', 4.5, +100, -120),
            (7, 5, '2026-03-26', 'CHI', 'Caesars', 'Points', 25.5, -110, -110),
            (8, 6, '2026-03-26', 'CHI', 'DraftKings', 'Threes', 4.5, -130, +110),
            (9, 7, '2026-03-26', 'CHI', 'FanDuel', 'Assists', 9.5, -110, -110),
            (10, 7, '2026-03-26', 'CHI', 'BetMGM', 'Assists', 9.5, -105, -115)
        ]
        
        cursor.executemany("""
            INSERT INTO PropLines (prop_id, player_id, game_date, opponent, sportsbook, stat_category, line, over_odds, under_odds) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, props)
  

        # 4. Insert Model Projections (Your "True" Probabilities)
        print("Inserting Model Projections...")
        projections = [
            # prop_id, true_over_prob
            (1, 0.580), # High value on Coby Over
            (2, 0.580), 
            (3, 0.410), # Low value on LaVine Threes
            (4, 0.410),
            (5, 0.520),
            (6, 0.550),
            (7, 0.480),
            (8, 0.610), # Steph Curry is inevitable
            (9, 0.500),
            (10, 0.500)
        ]
        cursor.executemany("INSERT INTO ModelProjections (prop_id, true_over_prob) VALUES (%s, %s);", projections)

        # 5. Insert User Bets (To populate the Analytics Tab)
        print("Inserting User Bets...")
        bets = [
            # prop_id, bet_side, wager, odds, payout, status
            (1, 'Over', 100.00, -110, 90.91, 'Won'),
            (3, 'Under', 50.00, -140, 35.71, 'Won'),
            (5, 'Over', 100.00, -105, 95.24, 'Lost'),
            (8, 'Over', 150.00, -130, 115.38, 'Pending') # Still waiting on this one
        ]
        cursor.executemany("""
            INSERT INTO UserBets (prop_id, bet_side, wager_amount, odds_taken, potential_payout, status) 
            VALUES (%s, %s, %s, %s, %s, %s);
        """, bets)

        # Save all changes
        conn.commit()
        print("✅ Database successfully seeded! You are ready for the demo.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error seeding database: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    seed_database()