#!/bin/sh

# This script can be used for deploying
npm install
npm install typescript
node_modules/typescript/bin/tsc backend/Server.ts -t es5 --removeComments
node_modules/typescript/bin/tsc public/js/Game.ts -t es5 --removeComments