"""Celery application configuration.

Ce module configure Celery pour les tâches asynchrones.
"""

from celery import Celery
from app.config import settings

# Configuration de Celery
celery_app = Celery(
    "ai_contract_guardian",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.analysis"],
)

# Configuration des tâches
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes
    task_soft_time_limit=540,  # 9 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)
