var Stage = function(theCanvas){

	this.mode = "PLOT";
	this.timeIndex = 0;

	var stage = this;
	var canvas = theCanvas;
	var c = canvas.getContext('2d');

	var vertices = [];
	var selectedVertex = null;

	var timeline = [];


	this.clear = function(){

		vertices = [];
	};

	this.plot = function(p){
		vertices.push(p);
	};

	this.update = function(){

		// Clear the canvas
		c.clearRect(0, 0, canvas.width, canvas.height);
		c.fillStyle = "#fff";
		c.fillRect(0,0,canvas.width,canvas.height);

		c.strokeStyle = 'rgb(64,64,64)';
		c.beginPath();

		var p = vertices[0] || {x:0,y:0};
		c.moveTo(p.x,p.y);

		for(var i=1;i<vertices.length;i++){
			p = vertices[i];

			c.lineTo(p.x,p.y);
		}

		c.stroke();
	
		vertices.forEach(function(p){

			c.fillStyle = 'rgba(0,255,0,0.3)';
			if(p === selectedVertex){
				c.fillStyle = 'rgb(0,0,255)';
			}
			
			//console.log(p,selectedVertex,p===selectedVertex);

			c.fillRect(p.x-4,p.y-4,8,8);

		});

		this.addKeyframe = function(){

			var keyframe = {

				time : this.timeIndex ,
				path : vertices.slice()
			};

			timeline.push(keyframe);
			console.log(timeline);
		};
	};

	// Event handlers - canvas
	function handleClick(e) {

		// do something on click or touch
		var x = e.offsetX;
		var y = e.offsetY;

		if(stage.mode === "PLOT") stage.plot({x:x,y:y});
		stage.update();

		//console.log(e);
		console.log("Clicked at: "+x+","+y);

	}

	function handleMouseDown(e){

		var x = e.offsetX;
		var y = e.offsetY;

		console.log("Mouse down.");

		if(stage.mode === "MOVE"){

			vertices.forEach(function(p){

				var dist = Math.sqrt( Math.pow(p.x-x,2) + Math.pow(p.y-y,2) );

				if(dist < 8){
					selectedVertex = p;
					console.log("Found vertex",p);
				}
			});
		}

		stage.update();
	}

	function handleMouseMove(e){

		var x = e.offsetX;
		var y = e.offsetY;

		//console.log("Mouse move.");

		if(stage.mode === "MOVE" && selectedVertex){

			selectedVertex.x = x;
			selectedVertex.y = y;
		}

		stage.update();
	}

	function handleMouseUp(e){

		var x = e.offsetX;
		var y = e.offsetY;

		console.log("Mouse up.");
		selectedVertex = null;

		stage.update();
	}

	// Event listeners - canvas
	canvas.addEventListener('click', handleClick, false);
	canvas.addEventListener('mousedown', handleMouseDown, false);
	canvas.addEventListener('mousemove', handleMouseMove, false);
	canvas.addEventListener('mouseup', handleMouseUp, false);

	// Events handlers - window
	function handleResize() {

		// Resize to a full-size canvas
		//canvas.width = document.body.clientWidth;
		//canvas.height = document.body.clientHeight;
		canvas.width = canvas.parentNode.clientWidth;
		canvas.height = canvas.parentNode.clientHeight;
		stage.update();

	}

	// Event listeners - window
	window.addEventListener('resize', handleResize, false);


};
