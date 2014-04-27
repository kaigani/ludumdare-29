//
// Manages shapes and animation
//

var Stage = function(theCanvas){

	"use strict";

	var stage = this;

	// PUBLIC 

	this.debug = false;

	this.mode = "PLOT";
	this.timeIndex = 0;

	// Holds all bones
	this.bones = [];
	this.currentBone = null;

	// Graph holds the shapes
	this.graph = null;

	// Current selected shape
	this.currentShape = null;

	// Animation timeline
	this.timeline = null;

	// PROTECTED

	var canvas = theCanvas;
	var c = canvas.getContext('2d');

	// Path manipulation
	var selectedVertex = null;

	// TIME INTERVAL for ANIMATION
	var timer;

	// Tool handlers -- additional will need to define an empty object as stage.tool.[ tool name ]
	this.tool = {
		PLOT: {} ,
		MOVE: {} ,
		DRAG: {} ,
		DELETE: {} ,
		INSERT: {} ,
		ADD_BONE: {} ,
		MOVE_BONE: {}
	};

	// Initialise stage properties - only for creating a new animation
	this.init = function(){

		// add the default bone
		this.currentBone = Bone.root;
		this.bones.push(Bone.root);

		// Initialise a graph
		this.graph = this.graph || new Graph("Default Graph");

		// Initialise a timeline
		this.timeline = this.timeline || new Timeline(this.graph);

		// init the current shape
		this.addShape();
	};

	this.reset = function(){

		// PUBLIC 

		this.debug = false;

		this.mode = "PLOT";
		this.timeIndex = 0;

		this.bones = [];
		this.currentBone = null;

		this.graph = null;
		this.timeline = null;
		this.currentShape = null;
	};

	this.loadAnimation = function(graph,timeline){

		this.reset();

		this.graph = graph;
		this.timeline = timeline;

		this.update();
	};

	this.loadAnimationByUrl = function(url){
		loader.loadDataUrl(url,function(data){
			var graph = data.graphList[0];
			var animation = data.animationList[0];
			var timeline = animation.findTimeline(graph.name);

			console.log("LOADING...");
			console.log("Graph: ",graph);
			console.log("Animation: ",animation);
			console.log("Timeline: ",timeline);

			stage.loadAnimation(graph,timeline);
		});
	};

	// PLOT relative to bone!
	this.plot = function(p){

		// relative to root bone -- for now, should use selected bone ***** TODO
		var localPt = this.currentBone.worldToLocalCoord(p);
		var vertex = new Vertex(this.currentBone,localPt.x,localPt.y);
		this.currentShape.addVertex(vertex);
	};

	// Origin point in world coordinates
	this.addBone = function(p){

		var name = 'bone_'+this.bones.length;
		var newBone = new Bone(name);
		newBone.translate(p.x,p.y);
		this.bones.push(newBone);

		this.currentBone = newBone;

		return newBone;
	};

	this.setCurrentBone = function(name){

		var found = false;

		for(var i=0;i<stage.bones.length;i++){

			if(stage.bones[i].name == name){
				stage.currentBone = stage.bones[i];
				found=true;
				break;
			}
		}

		if(!found) console.error("Stage.setCurrentBone - No such bone named: "+name);
	};

	this.addShape = function(){

		// Store the current buffer in the top shape stack
		//var last_i = this.shapes.length-1;
		//this.shapes[last_i].map(this.shape);

		// Create a new shape & push on stack
		var name = 'shape_'+this.graph.shapes.length;
		var newShape = new Shape(name);
		this.graph.addShape(newShape);

		// Load into the buffer - done this way mainly for debugging
		//this.shape.map(newShape);

		this.currentShape = newShape; // point to the new shape

		return newShape;
	};

	this.setCurrentShape = function(name){

		var shape = this.graph.findShape(name);

		if(shape){
			stage.currentShape = shape;
		}else{
			console.error("Stage.setCurrentShape - No shape found for name: "+name);
		}
	};

	this.update = function(){

		// for jslint
		var vertex,i,p;

		// Clear the canvas
		c.clearRect(0, 0, canvas.width, canvas.height);
		c.fillStyle = "#fff";
		c.fillRect(0,0,canvas.width,canvas.height);

		// SHAPES

		this.graph.shapes.forEach(function(shape){
		
			// Draw the shape
			c.strokeStyle = shape.strokeStyle;
			c.fillStyle = shape.fillStyle;

			c.beginPath();

			vertex = shape.vertices[0];
			if(typeof vertex !== 'undefined'){

				vertex.updateWorldTransform();
				p = { x : vertex.worldX , y : vertex.worldY };

				//console.log(JSON.stringify(p));
				c.moveTo(p.x,p.y);

				for(i=1;i<shape.vertices.length;i++){

					vertex = shape.vertices[i];
					vertex.updateWorldTransform();
					p = { x : vertex.worldX , y : vertex.worldY };

					//console.log(JSON.stringify(p));
					c.lineTo(p.x,p.y);
				}

				if(shape.closedPath) c.closePath();
				if(shape.hasFill) c.fill();
				if(shape.hasStroke) c.stroke();
			
			}

				// Test entire canvas - - - 

				if(stage.debug){
					console.log("Debugging edges...");
					c.fillStyle = 'rgba(255,255,0,0.4)';
					for(var x = 0;x<canvas.width;x++){
						for(var y=0;y<canvas.height;y++){
							if(edgeContainsPoint(stage.currentShape.vertices,x,y) != -1){

								c.fillRect(x,y,1,1);
							}
						}
					}
					console.log("Done.");
				}

		});

		// Dots for selected shape, selected vertex
		for(i=0;stage.currentShape && i<stage.currentShape.vertices.length;i++){

			vertex = stage.currentShape.vertices[i];
			p = { x : vertex.worldX , y : vertex.worldY };

			c.fillStyle = 'rgba(0,255,0,0.3)';
			if(vertex === selectedVertex){
				c.fillStyle = 'rgb(0,0,255)';
			}

			c.fillRect(p.x-4,p.y-4,8,8);
		}

		// BONES


		for(i=0;i<stage.bones.length;i++){

			var bone = stage.bones[i];
			p = { x : bone.worldX, y : bone.worldY };

			// Color selected
			if(bone === stage.currentBone){
				c.fillStyle = '#f00';
				c.strokeStyle = '#f00';
			}else{
				c.fillStyle = 'rgba(255,0,0,0.4)';
				c.strokeStyle = 'rgba(255,0,0,0.4)';
			}

			// Line
			c.beginPath();
			c.moveTo(p.x,p.y);

			// 40 px long pointer, TODO - accomodate bone length
			var dest = $V([p.x,p.y-40]).rotate(Math.rad(bone.worldRotation),$V([p.x,p.y]));
			var d = vectorToPoint(dest);

			c.lineTo(d.x*bone.worldScaleX,d.y*bone.worldScaleY);
			c.stroke();

			// Dot
			c.fillRect(p.x-4,p.y-4,8,8);

		}
	};

	// 
	// ANIMATION control
	//

	this.addKeyframe = function(){

		stage.timeline.keyframe(stage.timeIndex);

		console.log("Keyframe added at:",stage.timeIndex);
	};

	this.next = function(){
		stage.timeIndex++;
		stage.timeIndex = (stage.timeIndex < 1000)?stage.timeIndex:0;
		
		stage.timeline.apply(stage.timeIndex);
		stage.update();
	};

	this.prev = function(){
		stage.timeIndex--;
		stage.timeIndex = (stage.timeIndex > -1)?stage.timeIndex:999;

		stage.timeline.apply(stage.timeIndex);
		stage.update();
	};

	this.rewind = function(){
		stage.timeIndex = 0;
		stage.timeline.apply(stage.timeIndex);
		stage.update();
	};

	this.play = function(loop){

		console.log('Play.');

		stage.timeIndex = 0;

		clearInterval(timer);
		timer = setInterval(function(){

			stage.timeline.apply(stage.timeIndex,loop);
			stage.update();

			stage.timeIndex++;
			stage.timeIndex = (stage.timeIndex < 1000)?stage.timeIndex:0; // loop

			
		},1000/30);
	};

	this.pause = function(){

		console.log('Pause.');

		clearInterval(timer);
	};

	// Animation helper functions
	function updateVertices(){

		for(var i=0;i<stage.timeline.length;i++){

			var animation = stage.shape.timeline[i];

			for(var j=0; j<animation.length;j++){

				var keyframe = animation[j];
				var lastKey = (j>0)?animation[j-1]:animation[0];

				if(stage.timeIndex == keyframe.time){

					
					stage.shape.vertices[i] = { x: keyframe.x, y: keyframe.y };
					
					//console.log("Keyframe at: "+keyframe.time);
					

				}else if(stage.timeIndex > lastKey.time && stage.timeIndex < keyframe.time){
					// tween
					var period = keyframe.time - lastKey.time;
					var elapsed = stage.timeIndex - lastKey.time;
					var tween = elapsed / period;

					//console.log("Tween "+tween*100+"%");

					vertices[i] = { x: keyframe.x * tween + lastKey.x * (1-tween) , y: keyframe.y * tween + lastKey.y * (1-tween) };
				}
			}
		}
		//console.log(JSON.stringify(vertices));		
	}

	// 
	// TOOLS
	//

	// PLOT - - - - -

	this.tool.PLOT.handleClick = function(x,y){

		stage.plot({x:x,y:y});
	};

	// MOVE - - - - -

	this.tool.MOVE.handleMouseDown = function(x,y){

		selectedVertex = closestPointOnPath(stage.currentShape.vertices,x,y);
		console.log("selected vertex",selectedVertex);
	};

	this.tool.MOVE.handleMouseMove = function(x,y,dx,dy){

		// relative to bone of selected vertex

		if(selectedVertex){

			var p = selectedVertex.bone.worldToLocalCoord({x:x,y:y});

			selectedVertex.x = p.x;
			selectedVertex.y = p.y;
		}

	};

	this.tool.MOVE.handleMouseUp = function(x,y){

		if(selectedVertex){

			selectedVertex = null;

		}
	};

	// DRAG - - - - -

	this.tool.DRAG.handleMouseDown = function(x,y){
		stage.tool.DRAG.dragStart = true;
	};

	this.tool.DRAG.handleMouseMove = function(x,y,dx,dy){

		if(stage.tool.DRAG.dragStart){
			console.log("Dragging...",dx,dy);
			stage.currentShape.vertices.forEach(function(vertex){

				vertex.updateWorldTransform();

				// Convert offset to local - with world translation (scale, rotate)
				var p = { x : vertex.worldX+dx, y : vertex.worldY+dy };

				var localPt = vertex.bone.worldToLocalCoord(p);

				vertex.x = localPt.x;
				vertex.y = localPt.y;

			});
		}
	};

	this.tool.DRAG.handleMouseUp = function(x,y){
		stage.tool.DRAG.dragStart = false;
	};

	// DELETE - - - -

	this.tool.DELETE.handleClick = function(x,y){

		var p = closestPointOnPath(stage.currentShape.vertices,x,y);
		
		// inefficient because we looped through vertices once already
		for(var i=0;p && i<stage.currentShape.vertices.length;i++){

			if(stage.currentShape.vertices[i] === p){
				stage.currentShape.vertices.splice(i,1);
				p = null; // just to end the loop
			}
		}
	};

	// INSERT - - - -

	
	this.tool.INSERT.handleClick = function(x,y){
		
		var start = edgeContainsPoint(stage.currentShape.vertices,x,y);

		if(start != -1){

			console.log("On the line!");
			// insert after the starting vertex
			var vertex = stage.currentShape.vertices[start];
			// insert as a local point relative to bone
			var localPt = vertex.bone.worldToLocalCoord({x:x,y:y});
			x = localPt.x;
			y = localPt.y;

			stage.currentShape.vertices.splice(start,1,vertex,new Vertex(vertex.bone,x,y)); // add it after the start point
		}
	};

	// ADD_BONE - - - - -

	this.tool.ADD_BONE.handleClick = function(x,y){

		stage.addBone({x:x,y:y});
	};

	// MOVE_BONE - - - - -

	this.tool.MOVE_BONE.handleMouseDown = function(x,y){
		
		for(var i=0;i<stage.bones.length;i++){
			var bone = stage.bones[i];
			var dist = distanceFrom(x,y,bone.worldX,bone.worldY);

			// Move the origin point
			if(dist < 8){
				stage.currentBone = bone;
				stage.tool.MOVE_BONE.move = true;
			// Rotate - TODO - detect if on the EDGE, not just proximity
			}else if(dist < 40){
				stage.currentBone = bone;
				stage.tool.MOVE_BONE.rotate = true;
			}
		}
	};

	this.tool.MOVE_BONE.handleMouseMove = function(x,y,dx,dy){ // << look at world translation carefully

		if(stage.tool.MOVE_BONE.move){
			console.log("Move bone...",dx,dy);
			
			stage.currentBone.worldX += dx;
			stage.currentBone.worldY += dy;
			
		}else if(stage.tool.MOVE_BONE.rotate){
			console.log("Rotate bone...");

			// rotation 0 points in -Y direction
			var origin = $V([0,-1]);
			var offset = $V([ x-stage.currentBone.worldX, y-stage.currentBone.worldY ]);

			var rotation = Math.deg( origin.angleFrom(offset) ) * vectorSign(vectorToPoint(origin),vectorToPoint(offset)); // messy use of formats
			stage.currentBone.worldRotation = rotation;
		}
	};

	this.tool.MOVE_BONE.handleMouseUp = function(x,y){
		stage.tool.MOVE_BONE.move = false;
		stage.tool.MOVE_BONE.rotate = false;
	};



// TOOL Utility functions = = = =

// distanceFrom - between two points by coordinates
	
	function distanceFrom(x0,y0,x1,y1){

		var d = Math.sqrt( Math.pow(x1-x0,2) + Math.pow(y1-y0,2) );
		return d;

	}

// closestPointOnPath - returns the topmost match in the path array

	function closestPointOnPath(vertices,x,y){

		var o = null;

		vertices.forEach(function(vertex){

			vertex.updateWorldTransform();

			//var dist = Math.sqrt( Math.pow(vertex.worldX-x,2) + Math.pow(vertex.worldY-y,2) );
			var dist = distanceFrom(x,y,vertex.worldX,vertex.worldY);

			if(dist < 8){

				// exact vertex, not a clone
				o = vertex;
				console.log("Found vertex",JSON.stringify( vertex.getData() ));
			}
		});

		return o;
	}

// edgeContainsPoint - returns index of the vertex at the start point of the edge

	function edgeContainsPoint(vertices,x,y){

		for(var i=0;vertices.length > 1 && i<vertices.length;i++){

			var p0 = vertices[i];
			var p1 = vertices[i+1];

			if(i+1 == vertices.length){
				p1 = vertices[0];
			}

			p0.updateWorldTransform();
			p1.updateWorldTransform();

			var edge = $V( [ p1.worldX - p0.worldX, p1.worldY - p0.worldY ] );
			var edgeUnit = edge.toUnitVector();
			var direction = $V( [ x - p0.worldX, y - p0.worldY ] );

			var projection = edgeUnit.multiply( direction.modulus() );

			if( edge.modulus()-projection.modulus() > -1  && direction.distanceFrom(projection) < 8 ){

				//console.log("Clicked edge.");
				return( i );
			}
		}

		return -1;
	}

	//
	// Global Event handlers - canvas
	//

	function handleClick(e) {

		// do something on click or touch
		var x = e.offsetX;
		var y = e.offsetY;

		var tool = stage.tool[stage.mode];
		if(tool && tool.handleClick){
			tool.handleClick(x,y);
		}
		//console.log(e);
		console.log("Clicked at: "+x+","+y);

		stage.update();
	}

	// external variables to pass between events
	var trackMouseEvent = {};

	function handleMouseDown(e){

		var x = e.offsetX;
		var y = e.offsetY;

		trackMouseEvent.lastX = x;
		trackMouseEvent.lastY = y;

		console.log("Mouse down.");

		var tool = stage.tool[stage.mode];
		if(tool && tool.handleMouseDown){
			tool.handleMouseDown(x,y);
		}

		stage.update();

		// Only track movement after mousemove - no mouseovers
		canvas.addEventListener('mousemove', handleMouseMove, false);
	}

	function handleMouseMove(e){

		var x = e.offsetX;
		var y = e.offsetY;
		var dx = x - trackMouseEvent.lastX;
		var dy = y - trackMouseEvent.lastY;

		trackMouseEvent.lastX = x;
		trackMouseEvent.lastY = y;

		//console.log("Mouse move.");

		var tool = stage.tool[stage.mode];

		if(tool && tool.handleMouseMove){
			tool.handleMouseMove(x,y,dx,dy);
		}

		stage.update();
	}

	function handleMouseUp(e){

		var x = e.offsetX;
		var y = e.offsetY;
		trackMouseEvent.lastX = x;
		trackMouseEvent.lastY = y;

		console.log("Mouse up.");

		var tool = stage.tool[stage.mode];
		if(tool && tool.handleMouseUp){
			tool.handleMouseUp(x,y);
		}

		stage.update();

		// remove movement tracking
		canvas.removeEventListener('mousemove', handleMouseMove, false);
	}

	// Event listeners - canvas
	canvas.addEventListener('click', handleClick, false);
	canvas.addEventListener('mousedown', handleMouseDown, false);
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
