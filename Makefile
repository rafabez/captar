.PHONY: dev dev-up dev-down prod prod-up prod-down migrate clean

# === Development ===

dev:
	docker compose -f docker/docker-compose.yml up --build

dev-up:
	docker compose -f docker/docker-compose.yml up -d --build

dev-down:
	docker compose -f docker/docker-compose.yml down

dev-logs:
	docker compose -f docker/docker-compose.yml logs -f

# === Production ===

prod:
	docker compose -f docker/docker-compose.prod.yml up --build -d

prod-up:
	docker compose -f docker/docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker/docker-compose.prod.yml down

# === Database ===

migrate:
	docker compose -f docker/docker-compose.yml exec backend alembic upgrade head

migrate-create:
	docker compose -f docker/docker-compose.yml exec backend alembic revision --autogenerate -m "$(name)"

# === Frontend ===

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

# === Cleanup ===

clean:
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.prod.yml down -v
	rm -rf frontend/dist
	rm -rf backend/__pycache__ backend/app/**/__pycache__
