from ninja import ModelSchema, Schema
from pydantic import Field
from typing import List, Optional
from datetime import datetime
from .models import WebsiteInfo, CmsCrawlData

class PaginatedResponse(Schema):
    data: List[dict]  # 数据列表
    totalPages: int  # 总页数
    total: int  # 总记录数

class Filters(Schema):
    demand_side: Optional[str] = None  # 需求方
    main_host: Optional[str] = None  # 主域名
    site_name: Optional[str] = None  # 网站中文名称
    class_name: Optional[str] = None  # 栏目名称
    cms_name: Optional[str] = None  # cms来源名称

    site_url: Optional[str] = None  # 网站首页地址
    website_type: Optional[str] = None  # 网站类型
    site_province: Optional[str] = None  # 站点所在省
    site_city: Optional[str] = None  # 站点所在市
    site_county: Optional[str] = None  # 站点所在县(区)
    industry: Optional[str] = None  # 所属行业
    crawl_status: Optional[int] = None  # 采集状态：0-待采集，1-采集正常，-1-采集异常, -2-网站异常
    crawl_person: Optional[str] = None  # 采集负责人
    config_status: Optional[int] = None  # 配置状态：0-待配置(新源)，1-已配置
    config_person: Optional[str] = None  # 任务添加人
    jr_storage: Optional[int] = None  # 今天入库量
    zr_storage: Optional[int] = None  # 昨天入库量
    qr_storage: Optional[int] = None  # 前天入库量
    mon_storage: Optional[int] = None  # 本月入库量
    dir_level: Optional[int] = None  # 目录层级

    importance_level: Optional[int] = None  # 重要程度：0-特殊源, 1-A级别, 2-B级别, 3-C级别
    remark: Optional[str] = None  # 备注
    created_at: Optional[datetime] = None  # 插入日期
    updated_at: Optional[datetime] = None  # 更新日期
    crawl_program_name: Optional[str] = None  # 采集负责人

    # 添加模糊查询字段
    site_name_like: Optional[str] = None
    main_host_like: Optional[str] = None


class FiltersCmsCrawlData(Schema):
    aus_id: Optional[str] = None  # 主键id
    title: Optional[str] = None  # 标题
    comments: Optional[str] = None  # 链接
    main_host: Optional[str] = None  # 主域名
    classd_name: Optional[str] = None  # 来源名称
    publish_date: Optional[str] = None  # 发布日期
    table_name: Optional[str] = None  # 数据库
    table_name2: Optional[str] = None  # 数据表
    area: Optional[int] = None  # 地区
    category: Optional[str] = None  # 行业
    files: Optional[int] = None  # 附件
    created_at: Optional[datetime] = None  # 插入日期
    program_source: Optional[int] = None  # 数据来源
    responsible_person: Optional[int] = None  # 负责人
    client_name: Optional[str] = None  # 客户端名称
    client_ip: Optional[str] = None  # 客户端ip
    cms_id: Optional[str] = None  # 同步后id
    source: Optional[str] = None  # 来源名称

class WebSiteSchemaIn(ModelSchema):
    class Config:
        model = WebsiteInfo
        model_fields = [
            'demand_side',  # 需求方
            'main_host',  # 主域名
            'site_name',  # 网站中文名称
            'class_name',
            'cms_name',
            'dir_level',
            'site_url',  # 网站首页地址
            'website_type',  # 网站类型
            'site_province',  # 站点所在省
            'site_city',  # 站点所在市
            'site_county',  # 站点所在县(区)
            'industry',  # 所属行业
            'crawl_status',  # 采集状态
            'crawl_person',  # 采集负责人
            'config_status',  # 配置状态
            'config_person',  # 任务添加人
            'importance_level',  # 重要程度
            'remark',  # 备注
            'crawl_program_name',
        ]

class WebSiteSchemaOut(ModelSchema):
    class Config:
        model = WebsiteInfo
        model_fields = [
            'id',  # ID
            'demand_side',  # 需求方
            'main_host',  # 主域名
            'site_name',  # 网站中文名称
            'site_url',  # 网站首页地址
            'website_type',  # 网站类型
            'site_province',  # 站点所在省
            'site_city',  # 站点所在市
            'site_county',  # 站点所在县(区)
            'industry',  # 所属行业
            'crawl_status',  # 采集状态
            'crawl_person',  # 采集负责人
            'config_status',  # 配置状态
            'config_person',  # 任务添加人
            'jr_storage',  # 今天入库量
            'zr_storage',  # 昨天入库量
            'qr_storage',  # 前天入库量
            'mon_storage',  # 本月入库量
            'importance_level',  # 重要程度
            'remark',  # 备注
            'created_at',  # 插入日期
            'updated_at',  # 更新日期
            'class_name',
            'cms_name',
            'dir_level',
            'crawl_program_name',
        ]


class CmsDataSchemaOut(ModelSchema):
    class Config:
        model = CmsCrawlData
        model_fields = [
            "aus_id",
            "title",
            "comments",
            "main_host",
            "classd_name",
            "publish_date",
            "table_name",
            "table_name2",
            "area",
            "category",
            "files",
            "created_at",
            "program_source",
            "responsible_person",
            "client_name",
            "client_ip",
            "cms_id",
            "source",
        ]