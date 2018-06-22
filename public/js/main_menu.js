ctx.fillStyle = "white";
ctx.font = "60px arial";
const headerPos = {
	blobs: (canvas.width / 2) - 90
};
ctx.fillText("Blobs", headerPos.blobs, 75);
ctx.fillStyle = "green";
ctx.fillText(".", headerPos.blobs + 145, 75);
ctx.fillStyle = "#7777FF";
ctx.fillText("io", headerPos.blobs + 160, 75);
ctx.fillStyle = "#FFFFFF";
ctx.font = "35px arial";
ctx.strokeStyle = "#FFFFFF";
// Singleplayer button
ctx.strokeRect(headerPos.blobs - 200, 200, 250, 100);
ctx.fillText("Singleplayer", headerPos.blobs - 170, 260);
// Multiplayer button
ctx.strokeRect(headerPos.blobs + 150, 200, 250, 100);
ctx.fillText("Multiplayer", headerPos.blobs + 190, 260);
