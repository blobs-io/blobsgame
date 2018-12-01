#!/bin/bash

git clone https://github.com/blobs-io/blobs.io.git
rm -rf ./backend ./public
mv blobs.io/* ./
rm -rf blobs.io
