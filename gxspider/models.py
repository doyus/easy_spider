# coding=utf-8
# -*- encoding: utf-8 -*-
# Create your models here.
from django.db import models
from django.utils.translation import gettext_lazy as _

class WebsiteInfo(models.Model):
    id = models.AutoField(primary_key=True)
    demand_side = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("需求方"))
    main_host = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("主域名"))
    site_name = models.CharField(max_length=300, blank=True, null=True, verbose_name=_("网站中文名称"))
    site_url = models.URLField(max_length=255, blank=True, null=True, verbose_name=_("网站首页地址"))
    website_type = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("网站类型"))
    site_province = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("站点所在省"))
    site_city = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("站点所在市"))
    site_county = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("站点所在县(区)"))
    industry = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("所属行业"))
    crawl_status = models.SmallIntegerField(default=0, verbose_name=_("采集状态"), choices=(
        (0, _("待采集")),
        (1, _("采集正常")),
        (-1, _("采集异常")),
        (-2, _("网站异常"))
    ))
    crawl_person = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("采集负责人"))
    config_status = models.SmallIntegerField(default=0, verbose_name=_("配置状态"), choices=(
        (0, _("待配置(新源)")),
        (1, _("已配置"))
    ))
    config_person = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("任务添加人"))
    jr_storage = models.IntegerField(default=0, verbose_name=_("今天入库量"))
    zr_storage = models.IntegerField(default=0, verbose_name=_("昨天入库量"))
    qr_storage = models.IntegerField(default=0, verbose_name=_("前天入库量"))
    mon_storage = models.IntegerField(default=0, verbose_name=_("本月入库量"))
    importance_level = models.SmallIntegerField(default=0, verbose_name=_("重要程度"), choices=(
        (0, _("特殊源")),
        (1, _("A级别")),
        (2, _("B级别")),
        (3, _("C级别"))
    ))
    remark = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("备注"))

    creator_id = models.IntegerField(default=0, verbose_name=_("创建人id"))
    modifier = models.CharField(max_length=13, default=None, verbose_name=_("创建人姓名"))
    belong_dept = models.CharField(max_length=13, default=None, verbose_name=_("所属部门"))

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("插入日期"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("更新日期"))

    class_name = models.CharField(max_length=150, verbose_name=_("栏目名称"), null=True)
    cms_name = models.CharField(max_length=300, verbose_name=_("CMS来源名称"), null=True)
    crawl_program_name = models.CharField(max_length=300, verbose_name=_("采集程序"), null=True)

    dir_level = models.SmallIntegerField(default=1, verbose_name=_("目录层级"), choices=(
        (1, _("主网站")),
        (2, _("栏目")),
    ))

    class Meta:
        db_table = 'website_info'
        verbose_name = _('网站基本信息')
        verbose_name_plural = verbose_name
        unique_together = ('main_host',)

    def __str__(self):
        return self.site_name or self.main_host



from django.db import models
from django.utils.translation import gettext_lazy as _

class CmsCrawlData(models.Model):
    aus_id = models.BigAutoField(primary_key=True, verbose_name=_("唯一标识"))
    deduct_md5 = models.CharField(max_length=32, verbose_name=_("MD5值，用于去重"))
    title = models.CharField(max_length=600, verbose_name=_("公告标题"))
    comments = models.CharField(max_length=1000, null=True, blank=True, verbose_name=_("详情页地址"))
    main_host = models.CharField(max_length=255, null=True, blank=True, verbose_name=_("主域名"))
    ok_status = models.CharField(max_length=3, verbose_name=_("cms发布状态"))
    classd_name = models.CharField(max_length=200, verbose_name=_("cms来源名称"))
    publish_date = models.DateField(verbose_name=_("发布日期"))
    table_name2 = models.CharField(max_length=50, verbose_name=_("cms相关表名"))
    classd_id = models.CharField(max_length=50, verbose_name=_("分类ID"))
    table_name = models.CharField(max_length=50, verbose_name=_("表名"))
    original_id = models.BigIntegerField(verbose_name=_("cms原始ID"))
    area = models.CharField(max_length=50, verbose_name=_("区域"))
    area_id = models.IntegerField(verbose_name=_("区域ID"))
    category = models.CharField(max_length=100, verbose_name=_("类别"))
    category_id = models.CharField(max_length=50, verbose_name=_("类别ID"))
    files = models.JSONField(verbose_name=_("文件"))
    sync_status = models.SmallIntegerField(default=0, verbose_name=_("同步状态"), choices=(
        (0, _("未同步")),
        (1, _("同步成功")),
        (-1, _("同步失败")),
        (2, _("附件带下载")),
        (3, _("附件下载成功"))
    ))

    crawl_status = models.SmallIntegerField(default=0, verbose_name=_("抓取状态"), choices=(
        (0, _("未处理")),
        (1, _("处理成功")),
        (-1, _("处理失败")),
        (2, _("待下载附件")),
        (3, _("时间大于3天"))
    ))
    sync_remark = models.TextField(null=True, blank=True, verbose_name=_("同步备注，失败时记录原因"))
    crawl_remark = models.TextField(null=True, blank=True, verbose_name=_("抓取备注，失败时记录原因"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("插入日期"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("更新日期"))
    program_source = models.CharField(max_length=20, null=True, blank=True, verbose_name=_("抓取程序"))
    client_name = models.CharField(max_length=50, null=True, blank=True, verbose_name=_("机器名称"))
    client_ip = models.CharField(max_length=50, null=True, blank=True, verbose_name=_("客户端ip"))
    cms_id = models.CharField(max_length=255, null=True, blank=True, verbose_name=_("发布到cms后的id"))
    responsible_person = models.CharField(max_length=20, null=True, blank=True, verbose_name=_("负责人"))
    source = models.CharField(max_length=10, null=True, blank=True, verbose_name=_("cms_source值"))

    class Meta:
        db_table = 'cms_crawl_data'
        verbose_name = _('爬虫数据')
        verbose_name_plural = verbose_name
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['deduct_md5'], name='idx_deduct_md5'),
            models.Index(fields=['title'], name='idx_title'),
            models.Index(fields=['publish_date'], name='idx_publish_date'),
        ]
        unique_together = ('deduct_md5',)

    def __str__(self):
        return f"{self.aus_id} - {self.title[:50]}"

class CmsCrawlDataContent(models.Model):
    # id = models.OneToOneField(CmsCrawlData, on_delete=models.CASCADE, primary_key=True, verbose_name=_("关联数据ID"))
    aus_id = models.OneToOneField(CmsCrawlData, on_delete=models.CASCADE, primary_key=True, db_column='id', related_name='content')
    description = models.TextField(verbose_name=_("描述"))

    class Meta:
        db_table = 'cms_crawl_data_content'
        verbose_name = _('爬虫数据内容')
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.id} - {self.description[:50]}"