#!/bin/bash

git clone https://github.com/blobs-io/blobs.io.git
echo '--- Successfully cloned the repository ---';
rm -rf ./backend ./public
mv blobs.io/* ./
rm -rf blobs.io
echo '--- Old data has been overwritten. ---';
echo '--- Make sure to change the host in frontend JavaScript files! ---';
