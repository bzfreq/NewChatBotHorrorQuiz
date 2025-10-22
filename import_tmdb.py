import json
import sqlite3
from tqdm import tqdm

print("🩸 HORROR ORACLE - TMDB IMPORT SCRIPT 🩸")
print("=" * 50)

# Create database
print("\n📦 Creating database...")
conn = sqlite3.connect('horror_movies.db')
cursor = conn.cursor()

# Create table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        original_title TEXT,
        adult INTEGER DEFAULT 0,
        popularity REAL,
        video INTEGER DEFAULT 0
    )
''')

cursor.execute('CREATE INDEX IF NOT EXISTS idx_title ON movies(title)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_original_title ON movies(original_title)')

print("✅ Database created!")

# Read and import JSON
print("\n📂 Reading TMDB export file...")
print("⚠️  This will take 5-10 minutes...")

try:
    with open('movie_ids_10_18_2025.json', 'r', encoding='utf-8') as f:
        total_movies = 0
        imported_movies = 0
        batch = []
        batch_size = 1000
        
        for line_num, line in enumerate(f, 1):
            if line_num % 100000 == 0:
                print(f"📊 Processed {line_num:,} lines... ({imported_movies:,} movies imported)")
            
            try:
                movie = json.loads(line.strip())
                total_movies += 1
                
                # Import ALL movies (we'll filter later in the app)
                batch.append((
                    movie.get('id'),
                    movie.get('title', ''),
                    movie.get('original_title', ''),
                    movie.get('adult', 0),
                    movie.get('popularity', 0.0),
                    movie.get('video', 0)
                ))
                
                # Insert in batches for speed
                if len(batch) >= batch_size:
                    cursor.executemany('''
                        INSERT OR REPLACE INTO movies 
                        (id, title, original_title, adult, popularity, video)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', batch)
                    conn.commit()
                    imported_movies += len(batch)
                    batch = []
                    
            except json.JSONDecodeError:
                continue
        
        # Insert remaining batch
        if batch:
            cursor.executemany('''
                INSERT OR REPLACE INTO movies 
                (id, title, original_title, adult, popularity, video)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', batch)
            conn.commit()
            imported_movies += len(batch)
        
        print(f"\n✅ IMPORT COMPLETE!")
        print(f"📊 Total lines processed: {total_movies:,}")
        print(f"🎬 Movies imported: {imported_movies:,}")
        
        # Show some stats
        cursor.execute('SELECT COUNT(*) FROM movies')
        db_count = cursor.fetchone()[0]
        print(f"💾 Movies in database: {db_count:,}")
        
        # Show sample
        print("\n🎬 Sample movies:")
        cursor.execute('SELECT title FROM movies ORDER BY popularity DESC LIMIT 5')
        for row in cursor.fetchall():
            print(f"  • {row[0]}")
        
except FileNotFoundError:
    print("❌ ERROR: movie_ids_10_18_2025.json not found!")
    print("Make sure the file is in the same folder as this script.")
except Exception as e:
    print(f"❌ ERROR: {e}")
finally:
    conn.close()

print("\n🩸 DONE! Your database is ready!")
print("=" * 50)
