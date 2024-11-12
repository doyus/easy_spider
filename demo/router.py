#!/usr/bin/env python
# -*- coding: utf-8 -*-
# time: 2024/7/21 14:10
# file: router.py
# author: 

from ninja import Router
from demo.api import router

demo_router = Router()
demo_router.add_router('/', router, tags=["Demo"])