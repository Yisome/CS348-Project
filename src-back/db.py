import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load the environment variables from your .env file
load_dotenv()

def get_db_connection():
    """
    Establishes a connection to the Neon PostgreSQL database.
    """
    try:
        # Connect using the URL stored in your .env file
        conn = psycopg2.connect(
            os.environ.get("DATABASE_URL"),
            cursor_factory=RealDictCursor 
        )
        # Stage 3 Deliverable C: Transactions and Isolation Levels
        # Set explicitly to READ COMMITTED to prevent dirty reads.
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_READ_COMMITTED)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None