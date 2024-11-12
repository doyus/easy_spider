#!/usr/bin/env python
# -*- coding: utf-8 -*-
# file: api.py
# author:
import time
from typing import List
from django.shortcuts import get_object_or_404
from ninja import Router, Query
from .schemas import (
    TaskNameSchemaIn, TaskNameSchemaOut, Filters, TaskNameCronSchemaIn
)
from ninja.pagination import paginate
from .models import *
from utils.fu_crud import create, delete, update, retrieve
from utils.fu_ninja import MyPagination

router = Router()
import json
from urllib.parse import urlparse
from django.core.exceptions import ObjectDoesNotExist
from utils.usual import get_user_info_from_token
# import datetime
import redis
from conf.env import *

redis_server = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, db=7)
from datetime import datetime, timedelta


@router.get("/queryTasks", response=List[TaskNameSchemaOut])
@paginate(MyPagination)
def query_tasks(request, filters: Filters = Query(...)):
    try:
        # print("1111111111111111111111111111", Query, filters)
        a = time.time()
        qs = retrieve(request, TasksName, filters)
        # print("aaaa", time.time()-a)
        # three_days_ago = datetime.now() - timedelta(days=180)
        # for index, qq in enumerate(qs):
        #     if index>3:
        #         break
        #     print(qq.run_monit) #['crawl_interval_type'] = 4
            # if not qq.run_monit:
            #     qq.run_monit = {}
            # if qq.site_name:
            #     classd_name = qq.site_name + "(bgspider_scrapy)"
            # else:
            #     classd_name = qq.website_name + '(' + qq.principal + ')' + '_' + \
            #                   qq.class_name + "(bgspider_scrapy)"
            # if qq.status != 0:
            #     # qq.run_monit['save_count'] = CmsCrawlData.objects.filter(classd_name=classd_name,
            #     #                                                          publish_date__gte=three_days_ago).count()
            #     qq.run_monit['save_count'] = 10000
            #     if qq.run_monit['save_count'] == 0:
            #         qq.status = 5
        print("bbbbb", time.time()-a)
        return qs
    except:
        import traceback
        traceback.print_exc()


@router.get("/demo", auth=None)
def create_task1(request):
    return {}


@router.post("/create_task", response=TaskNameSchemaOut)
def create_task(request, data: TaskNameCronSchemaIn):
    data_dict = data.dict()
    urlStr = data_dict['main_host']
    user_info = get_user_info_from_token(request)
    # user_name = user_info['username']
    name = user_info['name']
    data_dict['principal'] = str(name)
    mainHost = urlparse(urlStr).hostname
    if mainHost:
        data_dict['main_host'] = mainHost
        website_name = data_dict['website_name']
        if not TasksName.objects.filter(website_name=website_name, main_host=mainHost).first():
            website = create(request, data_dict, TasksName)
            return website
        else:
            raise ValueError('任务重复')
    else:
        raise ValueError('网站地址非法格式')


@router.put("/update_task/{id}", response=TaskNameSchemaOut)
def update_task(request, id: int, payload: TaskNameSchemaIn):
    try:
        website = get_object_or_404(TasksName, id=id)
        data_dict = payload.dict()
        if dict(payload)['crawl_type'] != '3':
            if data_dict['run_dp'] == 1:
                data_dict['status'] = 0
                redis_server.lpush('cron_append', json.dumps(data_dict, ensure_ascii=False))
            else:
                data_dict['status'] = -1
                redis_server.lpush('cron_append', json.dumps(data_dict, ensure_ascii=False))
                data_dict['next_crawl_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for attr, value in data_dict.items():
            setattr(website, attr, value)
        website.save()
    except:
        import traceback
        traceback.print_exc()
    return website


##########################################不需要认证接口###########################################################
@router.get("/spider_version", auth=None)
def spider_version(request):
    tasks = SpiderVersionName.objects.filter(name='spider_exe').first()
    result_json = {}
    result_json['version'] = tasks.spider_version
    return result_json


@router.get("/query_task", auth=None)
def query_task(request):
    """
    查询单个任务
    """
    ids = request.GET['id']
    tasks = TasksName.objects.filter(id=ids).first()
    result_json = json.loads(tasks.config)
    result_json['id'] = tasks.id
    result_json['principal'] = tasks.principal
    result_json['website_name'] = tasks.website_name
    result_json['class_name'] = tasks.class_name
    result_json['index_url'] = tasks.index_url
    result_json['crawl_start_time'] = tasks.crawl_start_time
    result_json['crawl_end_time'] = tasks.crawl_end_time
    result_json['selectedFields'] = tasks.selectedFields
    # result_json['customConfig'] =json.loads(result_json['customConfig'])
    result_json['customConfig'] = "{}"
    return result_json


@router.post("/manageTask", auth=None)
def manage_task(request):
    user = request.user
    data = json.loads(request.body)
    id = data["id"]
    if id:
        duplicate_data = TasksName.objects.filter(id=id).first()
        duplicate_data.config = json.dumps(data, ensure_ascii=False)
        duplicate_data.save()
        return {'result': '1', 'data': '更新成功', 'user': str(user)}
    return {'result': '1', 'data': '保存成功'}


@router.post("/cms_exit_hash", auth=None)
def cms_exit_hash(request):
    data = json.loads(request.body)
    try:
        save_data = data['data']
        tasks = CmsCrawlData.objects.filter(deduct_md5=save_data['deduct_md5']).first()
        if tasks:
            return {'msg': '已经存在', 'id': tasks.aus_id, 'status': 1}
        else:
            return {'msg': '不存在', 'status': 0}
    except Exception as e:
        return {'msg': str(e), 'status': -1}


@router.post("/cms-save", auth=None)
def cms_data_save(request):
    data = json.loads(request.body)
    try:
        save_data = data['data']
        tasks = CmsCrawlData.objects.filter(deduct_md5=save_data['deduct_md5']).first()
        if tasks:
            return {'msg': '已经存在', 'id': tasks.aus_id}
        else:
            if "attachment_url" in str(save_data.get('files', None)):
                crawl_status = "2"
                files = []
            else:
                crawl_status = "1"
                files = []
            ss = CmsCrawlData(deduct_md5=save_data['deduct_md5'],
                              title=save_data['title'],
                              comments=save_data['comments'],
                              main_host=save_data['main_host'],
                              ok_status=save_data['ok_status'],
                              classd_name=save_data['classd_name'],
                              publish_date=save_data['publish_date'],
                              table_name2=save_data['table_name2'],
                              classd_id=save_data['classd_id'],
                              table_name=save_data['table_name'],
                              original_id=save_data['original_id'],
                              sync_status=save_data['sync_status'],
                              area=save_data['area'],
                              area_id=save_data['area_id'],
                              category=save_data['category'],
                              category_id=save_data['category_id'],
                              files=files,
                              crawl_status=crawl_status,
                              program_source=save_data['program_source'],
                              client_name=save_data['client_name'],
                              client_ip=save_data['client_ip'],
                              responsible_person=save_data['responsible_person'],
                              source=save_data['source'],
                              )
            ss.save()
            ccc = CmsCrawlDataContent(id=ss, description=save_data['description'])
            ccc.save()
            if crawl_status == '2':
                ff_id = ss.aus_id
                files = save_data.get('files', None)
                for attach in files:
                    if "http" in attach.get('attachment_url', ''):
                        req_data = attach.get('req_data', {})
                        if isinstance(req_data, str):
                            req_data = json.dumps(req_data)
                        fff = CmsCrawlDataAttachments(
                            id=ff_id,
                            method=attach['method'],
                            attachment_url=attach['attachment_url'],
                            req_data=req_data,
                        )
                        fff.save()
            return {'result': '1', 'data': '保存成功', 'id': ss.aus_id}
    except ObjectDoesNotExist:
        raise ValueError('未找到对应的数据')
