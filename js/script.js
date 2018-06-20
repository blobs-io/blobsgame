const canvas = document.getElementsByTagName("canvas")[0],
ctx = canvas.getContext("2d");
let nickname;
while((nickname = prompt("Nickname", "Player")).length > 16){
	alert("Nickname must not be longer than 16 characters.");
}
let ready = false,
	blobPosition = {
		x: (canvas.width / 2) - 50,
		y: (canvas.height / 2) - 50,
		direction: 0 // 0 = up, 1 = right, 2 = bottom, 3 = left
	};

canvas.width = window.innerWidth / 1.25;
canvas.height = window.innerHeight / 1.25;
ctx.font = "20px arial";
ctx.fillStyle = "white";
const image = new Image();
image.src = "https://discordemoji.com/assets/emoji/blobowo.png";
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
	
	ctx.clearRect(blobPosition.x - 40, blobPosition.y - 50, 120, 130);
	ctx.drawImage(image, blobPosition.x, blobPosition.y, 70, 70);
	ctx.fillText(nickname, blobPosition.x, blobPosition.y - 25);
}, 5);

window.addEventListener("keypress", function(data){
	if(!ready) return;
	if(data.charCode == 119){
		blobPosition.direction = 0;
	} else if(data.charCode === 100){
		blobPosition.direction = 1;
	} else if(data.charCode === 115){
		blobPosition.direction = 2;
	} else if(data.charCode === 97){
		blobPosition.direction = 3;
	}
});

window.addEventListener("resize", function(){
	canvas.width = window.innerWidth / 1.25;
	canvas.height = window.innerHeight / 1.25;
});
