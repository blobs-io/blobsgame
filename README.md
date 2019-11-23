# blobs game

[![Build Status](https://travis-ci.org/blobs-io/blobsgame.svg?branch=master)](https://travis-ci.org/blobs-io/blobsgame)

The official repository for the browser game "blobs"<br/>
**Note:** This game is still in development. It may not work yet. <br />
### Selfhosting notes
If you plan to host this on your own you need to compile the rating system API using node-gyp. Please do not create any issues regarding compiling and other problems with the rating system in general on this repository. Instead, please use the other one.
Internally it will send a request to the Discord API to execute a webhook. The authorization details (token and ID) are stored in the file `backend/Base.js`. If you do not wish to post traffic to Discord, leave values `undefined`.
The backend code and some parts of the frontend code are in TypeScript, which means that you will have to transpile the TS Code into JavaScript. This can be done by installing `tsc` and running `npm run transpile`. The `transpile` npm script was made for Travis testing, but it can also be used to transpile. Here is an example on how you can install everything:<br/>
```sh
npm install
npm run transpile
chmod -R 777 scripts
cd scripts && ./get-rs.sh && cd ..
node-gyp configure build
```

A documentation for this which includes controls, a description for each gamemode, item type and more can be found [here](https://y21.gitbook.io/blobs).

### What is this?
__A:__ Blobs is a work-in-progress multiplayer game that involves blob characters (you may know these from Android) that “nom” players in order to gain blob rating, which shows how skilled you are at the game.

### Where can I play this game?
__A:__ As stated above, this game is still a WIP and may not work yet. Its interface (login, registration and main menu) does exist and can be accessed through the internet by anybody [here](http://www.blobs-game.com) and all other pages should work well, means that you can register and login without any problems. The game should work fine, too, but there is not much yet.

### Any ETA when this game is ready?
__A:__ The game is playable, but it's lacking features. We are working on it to get it done as soon as possible. We do not know when this game is ready, but you can expect the first version to be ready in 2019.

### Can I donate for this project?
__A:__ No, there is no way to donate for now. Thank you for caring.

### I found a bug, where/how do I submit it?
__A:__ There are plenty of ways to submit issues/bugs. The best one is to create an issue on this repository by clicking the "Issues" tab at the top of this page or [here](https://github.com/blobs-io/blobsgame/issues/new). We will get to it as fast as possible. 
