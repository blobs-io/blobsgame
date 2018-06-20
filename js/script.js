const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");
let ready = false,
	blobPosition = {
		x: (canvas.width / 2) - 50,
		y: (canvas.height / 2) - 50,
		direction: 0 // 0 = up, 1 = right, 2 = bottom, 3 = left
	};

canvas.width = window.innerWidth / 2;
canvas.height = window.innerHeight / 2;
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
	
	ctx.clearRect(blobPosition.x - 20, blobPosition.y - 20, 100, 100);
	ctx.drawImage(image, blobPosition.x, blobPosition.y, 70, 70);
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
	canvas.width = window.innerWidth / 2;
	canvas.height = window.innerHeight / 2;
});
