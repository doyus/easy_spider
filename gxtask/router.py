#!/usr/bin/env python
# -*- coding: utf-8 -*-
# time: 2024/7/21 14:10
# file: router.py
# author: 

from ninja import Router
from gxtask.api import router

gxtask_router = Router()
gxtask_router.add_router('/', router, tags=["gxtask"])
