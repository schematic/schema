
build: components index.js
	browserify index.js -o build/build.js

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

test:
	@if [ "$(TERM)" == "dumb"  ]; then ./node_modules/.bin/mocha -C; else ./node_modules/.bin/mocha; fi

all: build test
	@echo "♬   It's the latest revision \n♬   Hot and fresh out the kitchen  "

.PHONY: clean test all
