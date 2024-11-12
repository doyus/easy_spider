from ninja import ModelSchema, Schema
from pydantic import Field
from typing import List, Optional
from datetime import datetime
from .models import TasksName

class PaginatedResponse(Schema):
    data: List[dict]  # 数据列表
    totalPages: int  # 总页数
    total: int  # 总记录数

class Filters(Schema):

    principal: Optional[str] = None  # 负责人
    id: Optional[int] = None  # 负责人
    crawl_type: Optional[str] = None  # 爬虫类型
    class_name: Optional[str] = None  # 类名
    main_host: Optional[str] = None  # 主机名
    website_name: Optional[str] = None  # 网站名称
    # config: Optional[str] = None  # 配置信息
    selectedFields: Optional[str] = None  # 去重字段
    run_monit: Optional[str] = None  #监控字段
    index_url: Optional[str] = None  # 索引url
    create_time: Optional[str] = None  # 创建时间
    update_time: Optional[str] = None  # 更新时间
    crawl_start_time: Optional[str] = None  # 爬虫开始时间
    crawl_end_time: Optional[str] = None  # 爬虫结束时间
    is_proxy: Optional[int] = None  # 是否添加代理
    next_crawl_time: Optional[str] = None  # 下一次采集时间
    crawl_interval: Optional[str] = None  # 采集间隔
    crawl_interval_type: Optional[int] = None  # 采集间隔
    status: Optional[int] = None  # 状态
    run_dp: Optional[int] = None  # 运行平台
    remark: Optional[str] = None  # 运行平台


class TaskNameSchemaIn(ModelSchema):
    class Config:
        model = TasksName
        model_fields = [
            'id',  # 负责人
            'website_name',  # 负责人
            'class_name',  # 网站中文名称
            'remark',  # 网站首页地址
            'principal',  # 站点所在省
            'main_host',  # 站点所在省
            'crawl_interval',  # 站点所在省
            'is_proxy',  # 站点所在省
            'selectedFields',  # 站点所在省
            'run_dp',  # 站点所在省
            # 'config',  # 配置文件
            'crawl_type' # 配置类型
        ]

class TaskNameSchemaOut(ModelSchema):
    class Config:
        model = TasksName
        model_fields = [
        'id',
        'principal',
        'remark',
        'crawl_type',
        'class_name',
        'main_host',
        'website_name',
        # 'config',
        'selectedFields',
        'run_monit',
        'index_url',
        'create_time',
        'update_time',
        'crawl_start_time',
        'crawl_end_time',
        'next_crawl_time',
        'is_proxy',
        'crawl_interval',
        'status',
        'run_dp',
        'crawl_interval_type'
        ]
class TaskNameCronSchemaIn(ModelSchema):
    class Config:
        model = TasksName
        model_fields = [
        'id',
        'crawl_interval',
        'crawl_interval_type'
        ]