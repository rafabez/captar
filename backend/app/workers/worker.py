"""ARQ worker entrypoint: `arq app.workers.worker.WorkerSettings`."""
from .queue import redis_settings
from . import tasks


class WorkerSettings:
    functions = [
        tasks.run_diagnostic_job,
        tasks.run_edital_job,
        tasks.run_section_job,
        tasks.run_brief_job,
        tasks.run_adherence_job,
        tasks.run_adapt_job,
    ]
    redis_settings = redis_settings()
    max_jobs = 5
    job_timeout = 300  # seconds — generous for slow local models (Ollama)
