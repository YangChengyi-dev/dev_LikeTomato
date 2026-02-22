import hashlib

# The hash from users.csv
target_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'

# Test common passwords
common_passwords = ['123456', 'password', 'admin', '12345678', 'test', '1234']

for password in common_passwords:
    hashed = hashlib.sha256(password.encode()).hexdigest()
    if hashed == target_hash:
        print(f"Found password: {password}")
        break
else:
    print("Password not found in common list")