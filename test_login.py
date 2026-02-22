import requests

# Test login with correct credentials
print("Testing login with admin:admin...")
response = requests.post('http://localhost:5000/login', data={'username': 'admin', 'password': 'admin'})
print(f"Status code: {response.status_code}")
print(f"URL after redirect: {response.url}")
print(f"Content length: {len(response.content)}")
print()

# Test login with incorrect credentials
print("Testing login with admin:wrong...")
response = requests.post('http://localhost:5000/login', data={'username': 'admin', 'password': 'wrong'})
print(f"Status code: {response.status_code}")
print(f"URL after redirect: {response.url}")
print(f"Content length: {len(response.content)}")
print()

# Test login with yangchenyi:admin
print("Testing login with 杨成一:admin...")
response = requests.post('http://localhost:5000/login', data={'username': '杨成一', 'password': 'admin'})
print(f"Status code: {response.status_code}")
print(f"URL after redirect: {response.url}")
print(f"Content length: {len(response.content)}")