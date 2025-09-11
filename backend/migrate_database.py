#!/usr/bin/env python3
"""
Database migration script for Eunoia Journal
Handles schema updates and data migration
"""
import sqlite3
import os
from datetime import datetime

def backup_database():
    """Create a backup of the existing database"""
    if os.path.exists('eunoia_journal.db'):
        backup_name = f'eunoia_journal_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
        os.rename('eunoia_journal.db', backup_name)
        print(f"✅ Database backed up as {backup_name}")
        return backup_name
    return None

def check_table_structure():
    """Check the current table structure"""
    conn = sqlite3.connect('eunoia_journal.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA table_info(journal_entries)")
        columns = cursor.fetchall()
        print("Current table structure:")
        for col in columns:
            print(f"  {col[1]} {col[2]} {'NOT NULL' if col[3] else 'NULL'}")
        return columns
    finally:
        conn.close()

def migrate_database():
    """Migrate the database to the new schema"""
    print("🔄 Starting database migration...")
    
    # Check if database exists
    if not os.path.exists('eunoia_journal.db'):
        print("❌ Database not found. Please run the application first to create the initial database.")
        return False
    
    # Backup existing database
    backup_file = backup_database()
    
    try:
        # Create new database with updated schema
        conn = sqlite3.connect('eunoia_journal.db')
        cursor = conn.cursor()
        
        # Check if we need to migrate
        cursor.execute("PRAGMA table_info(journal_entries)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        new_columns = [
            'emotion_confidence',
            'emotions_detected', 
            'emotion_group',
            'word_count',
            'updated_at'
        ]
        
        missing_columns = [col for col in new_columns if col not in existing_columns]
        
        if not missing_columns:
            print("✅ Database is already up to date!")
            return True
        
        print(f"📝 Adding missing columns: {', '.join(missing_columns)}")
        
        # Add missing columns
        for column in missing_columns:
            if column == 'emotion_confidence':
                cursor.execute("ALTER TABLE journal_entries ADD COLUMN emotion_confidence REAL")
            elif column == 'emotions_detected':
                cursor.execute("ALTER TABLE journal_entries ADD COLUMN emotions_detected TEXT")
            elif column == 'emotion_group':
                cursor.execute("ALTER TABLE journal_entries ADD COLUMN emotion_group VARCHAR(20)")
            elif column == 'word_count':
                cursor.execute("ALTER TABLE journal_entries ADD COLUMN word_count INTEGER")
            elif column == 'updated_at':
                cursor.execute("ALTER TABLE journal_entries ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        
        # Create indexes for better performance
        print("📊 Creating indexes...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date)",
            "CREATE INDEX IF NOT EXISTS idx_journal_entries_sentiment ON journal_entries(sentiment_score)",
            "CREATE INDEX IF NOT EXISTS idx_journal_entries_emotion ON journal_entries(emotion)",
            "CREATE INDEX IF NOT EXISTS idx_journal_entries_emotion_group ON journal_entries(emotion_group)",
            "CREATE INDEX IF NOT EXISTS idx_journal_entries_stress ON journal_entries(stress_level)",
            "CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        # Update existing entries with calculated values
        print("🔄 Updating existing entries...")
        cursor.execute("SELECT id, content FROM journal_entries WHERE word_count IS NULL")
        entries = cursor.fetchall()
        
        for entry_id, content in entries:
            word_count = len(content.split()) if content else 0
            cursor.execute(
                "UPDATE journal_entries SET word_count = ?, updated_at = ? WHERE id = ?",
                (word_count, datetime.utcnow().isoformat(), entry_id)
            )
        
        # Set updated_at for entries that don't have it
        cursor.execute("UPDATE journal_entries SET updated_at = created_at WHERE updated_at IS NULL")
        
        conn.commit()
        print("✅ Database migration completed successfully!")
        
        # Verify the migration
        print("\n📋 New table structure:")
        check_table_structure()
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        # Restore backup if migration failed
        if backup_file and os.path.exists(backup_file):
            if os.path.exists('eunoia_journal.db'):
                os.remove('eunoia_journal.db')
            os.rename(backup_file, 'eunoia_journal.db')
            print(f"🔄 Restored backup from {backup_file}")
        return False
    finally:
        conn.close()

def main():
    """Main migration function"""
    print("🚀 Eunoia Journal Database Migration")
    print("=" * 40)
    
    if migrate_database():
        print("\n🎉 Migration completed successfully!")
        print("You can now run the updated application.")
    else:
        print("\n💥 Migration failed!")
        print("Please check the error messages above and try again.")

if __name__ == "__main__":
    main()
