import requests

headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Authorization': 'bearer eyJ0eXBlIjogIkpXVCIsICJhbGciOiAiSFMyNTYifQ.eyJleHAiOiAxNzI0MjYyMDUzLCAibGFzdF9sb2dpbiI6IG51bGwsICJpc19zdXBlcnVzZXIiOiBmYWxzZSwgImlzX3N0YWZmIjogZmFsc2UsICJpc19hY3RpdmUiOiB0cnVlLCAiZGF0ZV9qb2luZWQiOiAiMjAyNC0wOC0yMSAxMDo0NDowOSIsICJpZCI6IDUsICJyZW1hcmsiOiBudWxsLCAiY3JlYXRvciI6IG51bGwsICJtb2RpZmllciI6IG51bGwsICJiZWxvbmdfZGVwdCI6IG51bGwsICJzb3J0IjogMSwgInVzZXJuYW1lIjogImR5cCIsICJlbWFpbCI6IG51bGwsICJtb2JpbGUiOiBudWxsLCAibmFtZSI6ICJcdTg0NjNcdTViODdcdTllNGYiLCAic3RhdHVzIjogdHJ1ZSwgImdlbmRlciI6IDEsICJ1c2VyX3R5cGUiOiAwLCAiZGVwdCI6IDMsICJmaXJzdF9uYW1lIjogbnVsbCwgImxhc3RfbmFtZSI6IG51bGwsICJob21lX3BhdGgiOiBudWxsLCAiZ3JvdXBzIjogW10sICJ1c2VyX3Blcm1pc3Npb25zIjogW10sICJwb3N0IjogW10sICJyb2xlIjogWzJdfQ.Vv2bs8AaKQt158QeD89sj7XeySaZkhvd0c4BIXlCJ-k',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json;charset=UTF-8',
    'Origin': 'http://localhost:3000',
    'Pragma': 'no-cache',
    'Referer': 'http://localhost:3000/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
}

# 查询
# params = {
#     'main_host': 'a.bc.c',
#     "page":1,
#     "pageSize":15
# }
#
# response = requests.get('http://localhost:3000/basic-api/api/gxspider/website_info', params=params, headers=headers)
# print(response.json())

# 创建
data = {'demand_side': '测试01', 'main_host': 'a.b.d', 'site_name': '测试', 'site_url': 'http://sthj.qdn.gov.cn/xwzx_0/tzgg_5820504/202407/t20240704_84948478.html', 'website_type': '', 'site_province': '', 'site_city': '', 'site_county': '', 'industry': '', 'crawl_status': -1, 'crawl_person': '董宇鹏', 'config_status': 1, 'config_person': '董宇鹏', 'jr_storage': 0, 'zr_storage': 0, 'qr_storage': 0, 'mon_storage': 14, 'importance_level': 1, 'remark': 'EXCEL', }
response = requests.post('http://localhost:3000/basic-api/api/gxspider/website_info', json=data, headers=headers)
print(response.json())


#
# res = requests.delete('http://localhost:3000/basic-api/api/gxspider/website_info/3436', headers=headers)
# print(res.text)

# 更新
# import requests
# import json
# # API endpoint
# url = 'http://localhost:3000/basic-api/api/gxspider/website_info/3436'
# data = {
#     'demand_side': '测试01',
#     'main_host': 'a.b.c',
#     'site_name': '测试2',
#     'site_url': 'http://sthj.qdn.gov.cn/xwzx_0/tzgg_5820504/202407/t20240704_84948478.html',
#     'website_type': '',
#     'site_province': '',
#     'site_city': '',
#     'site_county': '',
#     'industry': '',
#     'crawl_status': -1,
#     'crawl_person': '董宇鹏',
#     'config_status': 1,
#     'config_person': '董宇鹏',
#     'jr_storage': 0,
#     'zr_storage': 0,
#     'qr_storage': 0,
#     'mon_storage': 14,
#     'importance_level': 1,
#     'remark': 'EXCEL',
# }
# response = requests.put(url, data=json.dumps(data), headers=headers)
# print("Response:", response.text)
# print("Status Code:", response.status_code)