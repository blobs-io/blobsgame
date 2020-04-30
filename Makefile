GO=go
TERSER=terser
TSC=tsc

all: build transpile minify

build: main.go
	$(GO) build

transpile: public/js/game.ts
	$(TSC) public/js/game.ts -t es5

minify: public/js/game.js
	$(TERSER) public/js/game.js --compress --mangle -o public/js/game.js