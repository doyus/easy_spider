import requests

cookies = {
    'wh_gova_SHIROJSESSIONID': '3770bc0c-741e-4906-b9bb-9764f852b52d',
    'SHIROJSESSIONID': '07974733-2635-46f1-a109-06f9d8fdd775',
    'wzaConfigTime': '1727423945682',
}

headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    # 'Cookie': 'wh_gova_SHIROJSESSIONID=3770bc0c-741e-4906-b9bb-9764f852b52d; SHIROJSESSIONID=07974733-2635-46f1-a109-06f9d8fdd775; wzaConfigTime=1727423945682',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
}

response = requests.get('https://www.ww.gov.cn/openness/public/6603821/39367069.html', cookies=cookies, headers=headers)
print(response.text)