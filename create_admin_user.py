#!/usr/bin/env python3
import psycopg2
import os
import uuid
from datetime import datetime

# Database connection
dsn = os.environ.get('DATABASE_URL')
if not dsn:
    print("ERROR: DATABASE_URL environment variable not set")
    exit(1)

# SQL query with embedded values
user_id = str(uuid.uuid4())
email = 'admin@example.com'
name = 'Администратор'
password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMESn/gGEJ.lVuYKqPXXqxNqK6'
role = 'admin'
is_active = True
now = datetime.utcnow()

sql_query = f"""
INSERT INTO users (
    id, 
    email, 
    name, 
    password_hash, 
    role, 
    is_active, 
    registration_date, 
    last_active, 
    created_at, 
    updated_at
) VALUES (
    '{user_id}',
    '{email}',
    E'{name}',
    '{password_hash}',
    '{role}',
    {is_active},
    '{now.isoformat()}',
    '{now.isoformat()}',
    '{now.isoformat()}',
    '{now.isoformat()}'
);
"""

print("Executing SQL query:")
print(sql_query)
print("\n" + "="*80 + "\n")

try:
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Execute the query
    cur.execute(sql_query)
    conn.commit()
    
    print("✓ Admin user created successfully!")
    print(f"\nUser Details:")
    print(f"  ID: {user_id}")
    print(f"  Email: {email}")
    print(f"  Name: {name}")
    print(f"  Role: {role}")
    print(f"  Password: admin123")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"ERROR: {str(e)}")
    exit(1)
