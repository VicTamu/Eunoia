#!/usr/bin/env python3
"""
Sample data generator for Eunoia Journal demo
"""
import sqlite3
from datetime import datetime, timedelta
import random

# Sample journal entries with varied emotions and content
SAMPLE_ENTRIES = [
    {
        "content": "Had a great day today! Finished my project early and went for a walk in the park. The weather was perfect and I feel really accomplished. Looking forward to the weekend!",
        "sentiment_score": 0.8,
        "emotion": "joy",
        "stress_level": 0.1
    },
    {
        "content": "Feeling a bit overwhelmed with all the deadlines this week. Need to prioritize better and maybe ask for help. Trying to stay positive though.",
        "sentiment_score": -0.2,
        "emotion": "anxiety",
        "stress_level": 0.7
    },
    {
        "content": "Had an interesting conversation with a friend today about future plans. Feeling excited about new opportunities but also nervous about change.",
        "sentiment_score": 0.3,
        "emotion": "excitement",
        "stress_level": 0.4
    },
    {
        "content": "Not feeling great today. Had some disappointing news and feeling down. Trying to focus on the good things but it's hard sometimes.",
        "sentiment_score": -0.6,
        "emotion": "sadness",
        "stress_level": 0.5
    },
    {
        "content": "Productive day! Got a lot done and feeling good about my progress. Had a nice lunch with colleagues and learned something new.",
        "sentiment_score": 0.7,
        "emotion": "joy",
        "stress_level": 0.2
    },
    {
        "content": "Feeling frustrated with technology today. Nothing seems to be working right and I'm behind on my tasks. Need to take a break and reset.",
        "sentiment_score": -0.4,
        "emotion": "anger",
        "stress_level": 0.8
    },
    {
        "content": "Grateful for the small things today. Had a good cup of coffee, saw a beautiful sunset, and spent time with family. Sometimes it's the simple moments that matter most.",
        "sentiment_score": 0.9,
        "emotion": "love",
        "stress_level": 0.1
    },
    {
        "content": "Feeling anxious about an upcoming presentation. Practiced a lot but still nervous. Trying to stay calm and remember that I'm prepared.",
        "sentiment_score": -0.1,
        "emotion": "anxiety",
        "stress_level": 0.9
    },
    {
        "content": "Had a relaxing day off. Read a book, cooked a nice meal, and just enjoyed some quiet time. Feeling refreshed and ready for the week ahead.",
        "sentiment_score": 0.6,
        "emotion": "joy",
        "stress_level": 0.1
    },
    {
        "content": "Feeling conflicted about a decision I need to make. Weighed the pros and cons but still unsure. Sometimes life doesn't have clear answers.",
        "sentiment_score": -0.3,
        "emotion": "neutral",
        "stress_level": 0.6
    },
    {
        "content": "Excited about a new project I'm starting! It's challenging but I love learning new things. Feeling motivated and energized.",
        "sentiment_score": 0.8,
        "emotion": "excitement",
        "stress_level": 0.3
    },
    {
        "content": "Feeling tired and stressed. Too much on my plate and not enough time. Need to better manage my time and say no to some things.",
        "sentiment_score": -0.5,
        "emotion": "sadness",
        "stress_level": 0.9
    },
    {
        "content": "Had a wonderful surprise today! A friend visited unexpectedly and we had a great time catching up. It's amazing how good company can lift your spirits.",
        "sentiment_score": 0.9,
        "emotion": "joy",
        "stress_level": 0.1
    },
    {
        "content": "Feeling uncertain about the future. Lots of changes happening and I'm not sure what to expect. Trying to stay flexible and open to new possibilities.",
        "sentiment_score": -0.2,
        "emotion": "fear",
        "stress_level": 0.7
    },
    {
        "content": "Grateful for my health and the people in my life. Sometimes I forget to appreciate what I have. Today was a good reminder to count my blessings.",
        "sentiment_score": 0.7,
        "emotion": "love",
        "stress_level": 0.2
    }
]

def create_sample_data():
    """Create sample journal entries for demo purposes"""
    # Connect to the database
    conn = sqlite3.connect('eunoia_journal.db')
    cursor = conn.cursor()
    
    # Check if entries already exist
    cursor.execute("SELECT COUNT(*) FROM journal_entries")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"Database already has {count} entries. Skipping sample data creation.")
        conn.close()
        return
    
    print("Creating sample journal entries...")
    
    # Create entries over the past 30 days
    base_date = datetime.now() - timedelta(days=30)
    
    for i, entry_data in enumerate(SAMPLE_ENTRIES):
        # Distribute entries over the past 30 days
        days_ago = random.randint(0, 30)
        entry_date = base_date + timedelta(days=days_ago)
        
        # Add some random variation to the times
        hour = random.randint(8, 22)
        minute = random.randint(0, 59)
        entry_date = entry_date.replace(hour=hour, minute=minute)
        
        cursor.execute("""
            INSERT INTO journal_entries (date, content, sentiment_score, emotion, stress_level, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            entry_date,
            entry_data["content"],
            entry_data["sentiment_score"],
            entry_data["emotion"],
            entry_data["stress_level"],
            entry_date
        ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Created {len(SAMPLE_ENTRIES)} sample journal entries!")
    print("📊 You can now view mood trends and insights in the dashboard.")

if __name__ == "__main__":
    create_sample_data()
