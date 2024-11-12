#!/usr/bin/env python
# -*- coding: utf-8 -*-
# time: 2024/6/14 17:53
# file: tasks.py
# author: 

from celery.app import task

from gxadmin.celery import app


@app.task(name="system.tasks.test_task")
def test_task():
    print('test')