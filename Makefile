.PHONY: help install dev build test clean

help:
	@echo "Komutlar:"
	@echo "  make install  - Bağımlılıkları yükle"
	@echo "  make dev      - Docker ile başlat"
	@echo "  make build    - Production build"
	@echo "  make clean    - Temizle"

install:
	cd backend && pip install -r requirements/development.txt
	cd frontend && npm install

dev:
	docker-compose -f docker/docker-compose.yml up

build:
	docker-compose -f docker/docker-compose.yml build

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	rm -rf frontend/.next
