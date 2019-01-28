#!/bin/bash

git clone https://github.com/blobs-io/blobs.io.git
echo '--- Successfully cloned the repository ---';
rm -rf ./backend ./public ./maps
mv blobs.io/* ./
rm -rf blobs.io
pkill node
echo '--- Old data has been overwritten. ---';
