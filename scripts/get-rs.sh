#!/bin/bash

git clone https://github.com/blobs-io/rating-system --quiet
mkdir ../rating-system/include
mv rating-system/algorithm.cc ../rating-system/include/algorithm.cc
rm -rf rating-system