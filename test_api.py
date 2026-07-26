import requests

res = requests.post(
    "http://localhost:5001/score",
    json={"userEmail": "casual_user@example.com", "emailId": "syn_p3_14"}
)
print(res.status_code)
print(res.json())
