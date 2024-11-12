#!/usr/bin/env python
# -*- coding: utf-8 -*-
# time: 2024/7/21 14:10
# file: router.py
# author: 

from ninja import Router
from gxspider.api import router

gxspider_router = Router()
gxspider_router.add_router('/', router, tags=["gxspider"])
