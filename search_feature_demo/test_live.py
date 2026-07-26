import threading, time, requests, json
import sys
sys.argv = ['main.py', '--http-only']
from main import start_grpc_server, start_http_server, warmup_models, main

t = threading.Thread(target=main, daemon=True)
t.start()
time.sleep(30)

resp = requests.post('http://localhost:8001/api/v1/search', json={'query': 'Q3 Budget', 'user_email': 'bench@test.com'})
rjson = resp.json()
print('Timings:', json.dumps(rjson.get('timings', {}), indent=2))
for idx, res in enumerate(rjson.get('results', [])):
    scores = res.get('scores', {})
    if scores.get('vector', 0.0) > 0.0 and scores.get('bm25', 0.0) > 0.0:
        print(f'Match found at index {idx}:', json.dumps(scores, indent=2))
        break
else:
    print('No overlap found!')
