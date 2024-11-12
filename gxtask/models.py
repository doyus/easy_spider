# coding=utf-8
# -*- encoding: utf-8 -*-
# Create your models here.
from django.db import models

class TasksName(models.Model):
    id =models.AutoField(primary_key=True)
    principal = models.CharField(max_length=255, verbose_name='负责人')
    crawl_type=models.CharField(max_length=50, verbose_name='爬虫类型')
    class_name=models.CharField(max_length=100, verbose_name='类名')
    site_name=models.CharField(max_length=100, verbose_name='类名')
    main_host=models.CharField(max_length=100, verbose_name='主机名')
    website_name=models.CharField(max_length=255, verbose_name='网站名称')
    remark=models.CharField(null=True, max_length=255, verbose_name='网站名称')
    config=models.TextField(null=True, blank=True,verbose_name='配置信息')

    creator_id = models.IntegerField(default=0, verbose_name="创建人id")
    modifier = models.CharField(max_length=13, default=None, verbose_name="创建人姓名")
    belong_dept = models.CharField(max_length=13, default=None, verbose_name="所属部门")
    crawl_interval_type = models.IntegerField()

    selectedFields=models.JSONField(null=True, blank=True,verbose_name='去重字段')
    run_monit=models.JSONField(null=True, blank=True,verbose_name='监控字段')
    index_url=models.TextField(null=True, blank=True,verbose_name='索引url')
    create_time=models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    update_time=models.DateTimeField(auto_now=True, verbose_name='更新时间')
    # -------------------------以下为采集程序处理字段，暂时放在下面--------------------------------
    crawl_start_time=models.DateTimeField(blank=True, null=True, help_text='爬虫开始时间')
    crawl_end_time=models.DateTimeField(blank=True, null=True,  help_text='爬虫结束时间')
    is_proxy=models.IntegerField(blank=True, null=True,  help_text='爬虫结束时间')
    next_crawl_time=models.DateTimeField(null=True,help_text='下次采集时间')
    crawl_interval=models.CharField(max_length=50, default=None, verbose_name="采集间隔")
    status=models.IntegerField(blank=True, null=True,  help_text='爬取间隔时间')
    run_dp=models.IntegerField(blank=True, null=True,  help_text='爬取间隔时间')

    class Meta:
        db_table = 'bgspider_task'
        verbose_name = '任务列表'
        verbose_name_plural = verbose_name
    def __str__(self):
        return self.website_name or self.main_host

class SpiderVersionName(models.Model):
    id =models.IntegerField(default=0, primary_key=True)
    spider_version =models.CharField(max_length=50, verbose_name='负责人')
    name = models.CharField(max_length=50, verbose_name='负责人')
    class Meta:
        db_table = 'spider_version'
        verbose_name = '版本控制'
        verbose_name_plural = verbose_name
    def __str__(self):
        return 'spider_version'

class CmsCrawlData(models.Model):
    aus_id = models.BigAutoField(primary_key=True)
    deduct_md5 = models.CharField(max_length=32)
    title = models.CharField(max_length=600)
    comments = models.CharField(max_length=1000, blank=True, null=True)
    main_host = models.CharField(max_length=255, blank=True, null=True)
    ok_status = models.CharField(max_length=3)
    classd_name = models.CharField(max_length=200)
    publish_date = models.DateField()
    table_name2 = models.CharField(max_length=50)
    classd_id = models.CharField(max_length=50)
    table_name = models.CharField(max_length=50)
    original_id = models.BigIntegerField()
    area = models.CharField(max_length=50)
    area_id = models.IntegerField()
    category = models.CharField(max_length=100)
    category_id = models.CharField(max_length=50)
    files = models.JSONField()
    sync_status = models.SmallIntegerField()
    crawl_status = models.SmallIntegerField()
    sync_remark = models.TextField(blank=True, null=True)
    crawl_remark = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    program_source = models.CharField(max_length=20, blank=True, null=True)
    client_name = models.CharField(max_length=50, blank=True, null=True)
    client_ip = models.CharField(max_length=50, blank=True, null=True)
    cms_id = models.CharField(max_length=255, blank=True, null=True)
    responsible_person = models.CharField(max_length=20, blank=True, null=True)
    source = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cms_crawl_data'

class CmsCrawlDataContent(models.Model):
    id = models.OneToOneField(CmsCrawlData, models.DO_NOTHING, db_column='id', primary_key=True)
    description = models.TextField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'cms_crawl_data_content'

class CmsCrawlDataAttachments(models.Model):
    id =models.BigAutoField(primary_key=True)
    attachment_url = models.CharField(max_length=600)
    method = models.CharField(max_length=10)
    req_data = models.JSONField()

    class Meta:
        managed = False
        db_table = 'cms_crawl_data_attachments'