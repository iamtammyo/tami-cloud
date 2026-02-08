.PHONY: install fetch build all

install:
	pip install -r requirements.txt

fetch:
	python -m scraper.run

build:
	python -m sitegen.build

all: fetch build
