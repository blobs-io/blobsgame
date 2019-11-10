#!/bin/bash


# clone the rating-system repository
git clone https://github.com/blobs-io/rating-system --quiet

# navigate into cloned repo
cd rating-system

# make deps.sh file executable
chmod 777 deps.sh

# execute deps shell script to download required dependencies
./deps.sh

# return to scripts folder
cd ..

# compile rating-system to binary in project folder
g++ -Irating-system/include rating-system/main.cc -o b

# Move algorithm file to ../rating-system/include so the node addon can use it
mv rating-system/algorithm.cc ../rating-system/include

# remove repository (only the binary is needed)
rm -rf rating-system

# move executable file to main folder
mv b ../