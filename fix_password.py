import bcrypt

# Генерируем правильный хеш для пароля admin123
password = "admin123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(f"Email: admin@example.com")
print(f"Password: {password}")
print(f"Hash: {hashed.decode('utf-8')}")
print()

# И для test@admin.com
password2 = "12345678"
hashed2 = bcrypt.hashpw(password2.encode('utf-8'), bcrypt.gensalt())
print(f"Email: test@admin.com")
print(f"Password: {password2}")
print(f"Hash: {hashed2.decode('utf-8')}")
