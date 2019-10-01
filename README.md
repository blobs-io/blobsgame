# blobs.live

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f8355022c37c4c2f9c675f64b4378c88)](https://app.codacy.com/app/y21/blobs.io?utm_source=github.com&utm_medium=referral&utm_content=blobs-io/blobs.io&utm_campaign=Badge_Grade_Dashboard)
[![Build Status](https://travis-ci.org/blobs-io/blobs.io.svg?branch=master)](https://travis-ci.org/blobs-io/blobs.io)

The official repository for the blobs.live game<br/>
**Note:** This game is still in development. It may not work yet. <br />
### Selfhosting notes
If you plan to host this on your own you need to compile the basic BR algorithm which can be found on the `rating-system` repository of this organization. Please do not create any issues regarding compiling and other problems with the rating system in general on this repository. Instead, please use the other one.
Internally it will send a request to the Discord API to execute a webhook. The authorization details (token and ID) are stored in the file `backend/Base.js`. If you do not wish to post traffic to Discord, leave values `undefined`.
The backend code and some parts of the frontend code are in TypeScript, which means that you will have to transpile the TS Code into JavaScript. This can be done by installing `tsc` and running `npm run test`. The `test` npm script was made for Travis testing, but it can also be used to transpile.

### What is this?
__A:__ Blobs.live is a work-in-progress multiplayer game that involves blob characters (you may know these from Android) that “nom” players in order to gain blob rating, which shows how skilled you are at the game.

### Where can I play this game?
__A:__ As stated above, this game is still a WIP and may not work yet. Its interface (login, registration and main menu) does exist and can be accessed through the internet by anybody [here](https://blobs-io.glitch.me) and all other pages should work well, means that you can register and login without any problems. The game should work fine, too, but there is not much yet.

### Any ETA when this game is ready?
__A:__ The game is playable, but it's lacking features. We are working on it to get it done as soon as possible. We do not know when this game is ready, but you can expect the first version to be ready in 2019.

### Can I donate for this project?
__A:__ No, there is no way to donate for now. Thank you for caring.

### I found a bug, where/how do I submit it?
__A:__ There are plenty of ways to submit issues/bugs. The best one is to create an issue on this repository by clicking the "Issues" tab at the top of this page or [here](https://github.com/blobs-io/blobs.live/issues/new). We will get to it as fast as possible. 
