import requests

# Test the profiles endpoint
url = "http://localhost:8000/api/profiles/?role=student"

# First get a token
login_response = requests.post("http://localhost:8000/api/token/", json={
    "username": "admin@medical.edu",
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json()['access']
    
    # Now fetch profiles
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
else:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
