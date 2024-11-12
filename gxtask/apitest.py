import requests

headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Authorization': 'bearer eyJ0eXBlIjogIkpXVCIsICJhbGciOiAiSFMyNTYifQ.eyJleHAiOiAxNzMxMDEwNDA4LCAibGFzdF9sb2dpbiI6IG51bGwsICJpc19zdXBlcnVzZXIiOiB0cnVlLCAiaXNfc3RhZmYiOiB0cnVlLCAiaXNfYWN0aXZlIjogdHJ1ZSwgImRhdGVfam9pbmVkIjogIjIwMjQtMDctMjEgMDg6NTM6MjciLCAiaWQiOiAxLCAicmVtYXJrIjogbnVsbCwgImNyZWF0b3IiOiBudWxsLCAibW9kaWZpZXIiOiBudWxsLCAiYmVsb25nX2RlcHQiOiBudWxsLCAic29ydCI6IDEsICJ1c2VybmFtZSI6ICJzdXBlcmFkbWluIiwgImVtYWlsIjogIiIsICJtb2JpbGUiOiBudWxsLCAibmFtZSI6ICJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCAic3RhdHVzIjogdHJ1ZSwgImdlbmRlciI6IDEsICJ1c2VyX3R5cGUiOiAwLCAiZGVwdCI6IG51bGwsICJmaXJzdF9uYW1lIjogIiIsICJsYXN0X25hbWUiOiAiIiwgImhvbWVfcGF0aCI6IG51bGwsICJncm91cHMiOiBbXSwgInVzZXJfcGVybWlzc2lvbnMiOiBbXSwgInBvc3QiOiBbXSwgInJvbGUiOiBbXX0.SFc7Gp8n9Iob2kxGmfk7XUNAngXooDZshYh4dGG6LDM',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Referer': 'http://192.168.7.179:3000/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
}

params = {
    'page': '1',
    'pageSize': '10',
}

response = requests.get('http://192.168.7.179:8000/api/gxtask/queryTasks', params=params, headers=headers, verify=False)
print(response.text)