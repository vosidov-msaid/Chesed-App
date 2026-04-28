import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

db_url = os.getenv('DATABASE_URL')
if db_url.startswith('postgresql+asyncpg://'):
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')

print(f"Connecting to database...")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        tables = ['users', 'requests', 'commitments', 'reviews', 'categories']
        for table in tables:
            result = conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
            count = result.scalar()
            print(f'{table}: {count} rows')
except Exception as e:
    print(f"Error: {e}")
