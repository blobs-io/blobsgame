let nickname;
while((nickname = prompt("Nickname", "Player")).length > 10){
	alert("Nickname must not be longer than 10 characters.");
}
let ready = false,
	blobPosition = {
		x: (canvas.width / 2) - 50,
		y: (canvas.height / 2) - 50,
		direction: 0 // 0 = up, 1 = right, 2 = bottom, 3 = left
	};
	
const image = new Image();
image.src = "assets/blobowo.png";
image.onload = function(){
	ready = true;
	ctx.drawImage(image, blobPosition.x, blobPosition.y, 70, 70);
}

setInterval(function(){
	if(!ready) return;
	switch(blobPosition.direction){
		case 0: 
			if(blobPosition.y < 0) return;
			blobPosition.y--; 
		break;
		case 1: 
			if(blobPosition.x > canvas.width - 75) return;
			blobPosition.x++; 
		break;
		case 2: 
			if(blobPosition.y > canvas.height - 75) return;
			blobPosition.y++; 
		break;
		case 3:
			if(blobPosition.x < 10) return;
			blobPosition.x--; 
		break;
	}
	
	ctx.clearRect(blobPosition.x - 40, blobPosition.y - 50, 140, 140);
	ctx.drawImage(image, blobPosition.x, blobPosition.y, 70, 70);
	ctx.fillText(nickname, blobPosition.x, blobPosition.y - 25);
}, 5);
