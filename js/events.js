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

window.addEventListener("click", function(data){
	if(mode === "main"){
		if(data.clientX > (headerPos.blobs - 200) &&
			data.clientX < (headerPos.blobs + 50) &&
			data.clientY > 200 && 
			data.clientY < 300){
				// If singleplayer rectangle is clicked
			}
	}
});
