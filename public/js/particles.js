function initParticles(custom_canvas) {
	if (/(Android|webOS|iPad|iPod|Windows Phone|BlackBerry|iPhone)/.test(navigator.userAgent)) {
		return document.body.removeChild(document.getElementById("particles"));
	}
	const pCanvas = custom_canvas || document.getElementById("particles");
	const pctx = pCanvas.getContext("2d");
	// CSS
	pCanvas.style.position = "fixed";
	pCanvas.style.top = "-15px";
	pCanvas.style.left = "0px";
	pCanvas.style.zIndex = "-1";
	pCanvas.style.border = "none";
	// ---
	pCanvas.width = window.innerWidth - 2;
	pCanvas.height = window.innerHeight - 2;
	const particles = [];
	const pAmount = 35;
	
	class Particle {
		constructor(x, y, color = "#" + String(Math.floor(Math.random() * 9)).repeat(3)) {
			this.x = x;
			this.y = y;
			this.color = color;
		}
		
		draw() {
			pctx.beginPath();
			pctx.fillStyle = this.color;
			pctx.arc(this.x, this.y, 3, 0, 2 * Math.PI);
			pctx.fill();
		};
		
		clear() {
			pctx.clearRect(this.x - 10, this.y - 10, 20, 20);
		}
	};
	
	function createParticle(x, y) {
		const tempObj = new Particle(x, y);
		tempObj.draw();
		particles.push(tempObj);
	}
	
	for (let i = 0; i < pAmount; ++i) {
		createParticle(Math.random() * pCanvas.width, Math.random() * pCanvas.height);
	}
	
	setInterval(() => {
		if (pAmount > particles.length) {
			for(let i = 0; i < pAmount - particles.length; ++i) {
				createParticle(Math.random() * pCanvas.width, Math.random() * pCanvas.height);
			}
		}
		for(const particle of particles) {
			if (particle.y > 5) {
				particle.clear();
				particle.y -= .15;
				if (Math.random() > Math.random()) {
					particle.x += .1;
				} else particle.x -= .1;
				particle.draw();
			} else {
				particle.clear();
				particles.splice(particles.findIndex(v => v.x === particle.x), 1);
			}
		}
	}, 10);
	
}
