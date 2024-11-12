#!/usr/bin/env python
# -*- coding: utf-8 -*-
# file: api.py
# author:
import traceback
from typing import List
from django.shortcuts import get_object_or_404
from utils.fu_ninja import FuFilters, MyPagination
from utils.usual import get_user_info_from_token

from ninja import Router, Query
from ninja import Router
from ninja.pagination import paginate
from .schemas import (
    WebSiteSchemaIn,WebSiteSchemaOut,Filters,CmsDataSchemaOut,FiltersCmsCrawlData
)
from urllib.parse import urlparse
from .models import WebsiteInfo, CmsCrawlData,CmsCrawlDataContent
from utils.fu_crud import create, delete, update, retrieve
from utils.fu_ninja import MyPagination
from typing import Union, List, Dict

router = Router()

# 数据源管理
@router.post("/website_info", response=WebSiteSchemaOut)
def create_website(request, data: WebSiteSchemaIn):
    data_dict = data.dict()
    user_info = get_user_info_from_token(request)
    # user_name = user_info['username']
    name = user_info['name']
    data_dict['config_person'] = str(name)
    print("创建的字典",data_dict)
    print()
    data_dict['main_host'] = urlparse(data_dict['site_url']).netloc
    website = create(request, data_dict, WebsiteInfo)
    return website

@router.get("/website_info", response=List[WebSiteSchemaOut])
@paginate(MyPagination)
def query_website(request, filters: Filters = Query(...)):
    qs = retrieve(request, WebsiteInfo, filters)
    return qs

@router.delete('/website_info/{id}')
def delete_website(request, id: int):
    delete(id, WebsiteInfo)
    return {'success': True}

@router.put("/website_info/{id}", response=WebSiteSchemaOut)
def update_website(request, id: int, payload: WebSiteSchemaIn):
    website = get_object_or_404(WebsiteInfo, id=id)
    print("更新的字典",payload.dict())
    print()
    for attr, value in payload.dict().items():
        setattr(website, attr, value)
    website.save()
    return website

# # 爬虫数据库
@router.get("/cms_data", response=List[CmsDataSchemaOut])
@paginate(MyPagination)
def query_cms_data(request, filters: FiltersCmsCrawlData = Query(...)):
    try:
        print("aaaaccc", filters)
        qs = retrieve(request,CmsCrawlData, filters)
    except:
        import traceback
        traceback.print_exc()
    return qs

@router.get("/cms_data/{id}", response=Dict)
def get_cms_data_by_id(request, id: int):
    detail_id = id
    cms_data = get_object_or_404(CmsCrawlData, aus_id=detail_id)
    content = CmsCrawlDataContent.objects.filter(aus_id=detail_id).first()
    response_data = {
        'aus_id': cms_data.aus_id,
        'title': cms_data.title,
        'comments': cms_data.comments,
        'main_host': cms_data.main_host,
        'ok_status': cms_data.ok_status,
        'classd_name': cms_data.classd_name,
        'publish_date': str(cms_data.publish_date),
        'table_name2': cms_data.table_name2,
        'classd_id': cms_data.classd_id,
        'table_name': cms_data.table_name,
        'original_id': cms_data.original_id,
        'area': cms_data.area,
        'area_id': cms_data.area_id,
        'category': cms_data.category,
        'category_id': cms_data.category_id,
        'files': cms_data.files,
        'sync_status': cms_data.sync_status,
        'crawl_status': cms_data.crawl_status,
        'program_source': cms_data.program_source,
        'client_name': cms_data.client_name,
        'client_ip': cms_data.client_ip,
        'cms_id': cms_data.cms_id,
        'responsible_person': cms_data.responsible_person,
        'source': cms_data.source,
        'description': content.description if content else None
    }
    return response_data


# 配置爬虫接口
@router.get("/load_config/{id}", response=Dict, auth=None)
def get_config_by_id(request, id: int):
    print("aaa",id)
    data = {"req_type": "test", "basic_config": {"website_name": "采集网站名称测试", "website_category": "采集网站栏目",
                                                 "info_category": "ZBXX", "info_type": "ZBGG", "proxy_type": "none",
                                                 "region": "-1", "industry": "0", "start_page": "1", "end_page": "5",
                                                 "interval": "1"},
            "list_config": {"list_url": "列表页地址", "list_method": "GET", "list_params": "列表页参数",
                            "list_encoding": "utf-8", "list_headers": "列表页请求头", "list_cookies": "列表页cookie",
                            "list_retry": "3", "list_timeout": "30", "fieldNameSelectList": "list_rule", "fields": [
                    {"field_name": "list_rule", "field_type": "XPath", "expression": "列表页xpath值",
                     "prefix": "列表页前置值", "suffix": "列表页后置值",
                     "replace_rules": [{"old_value": "列表页替换old1", "new_value": "列表页替换new1"},
                                       {"old_value": "列表页替换old2", "new_value": "列表页替换new2"}]}]},
            "detail_config": {"detail_url": "详情页地址", "detail_method": "GET", "detail_params": "详情页参数",
                              "detail_encoding": "utf-8", "detail_headers": "详情页请求头",
                              "detail_cookies": "详情页cookie", "detail_retry": "3", "detail_timeout": "30",
                              "fieldNameSelectDetail": "publish_date", "fields": [
                    {"field_name": "publish_date", "field_type": "XPath", "expression": "详情页xpath值",
                     "prefix": "详情页前置值", "suffix": "详情页后置值",
                     "replace_rules": [{"old_value": "详情页替换old1", "new_value": "详情页替换new1"}]}]}}
    # data = {'meg':'zzz'}
    return data