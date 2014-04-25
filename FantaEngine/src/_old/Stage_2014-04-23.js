//
// Some concepts borrowed from Esoteric Software's SpineJS
//

var Bone = function(name){

	this.name = name || "Unnamed bone";

	this.worldX = 0;
	this.worldY = 0;
	this.worldRotation = 0.0;
	this.worldScaleX = 1.0;
	this.worldScaleY = 1.0;

	this.translate = function(x,y){

		this.worldX += x;
		this.worldY += y;
	};

	this.rotate = function(angle){
		this.worldRotation += angle;
	};

	this.scale = function(x,y){
		y = (typeof y !== 'undefined')?y:x;

		this.worldScaleX *= x;
		this.worldScaleY *= y;
	};

	this.getData = function(){

		return( {
			name : this.name ,
			worldX : this.worldX ,
			worldY : this.worldY ,
			worldRotation : this.worldRotation ,
			worldScaleX : this.worldScaleX ,
			worldScaleY : this.worldScaleY
		});
	};

	this.map = function(data){

		this.name = data.name;
		this.worldX = data.worldX;
		this.worldY = data.worldY;
		this.worldRotation = data.worldRotation;
		this.worldScaleX = data.worldScaleX;
		this.worldScaleY = data.worldScaleY;
	};

	this.localToWorldCoord = function(p){

		var dx = p.x;
		var dy = p.y;

		var x = this.worldX;
		var y = this.worldY;
		var rotation = this.worldRotation;
		var scaleX = this.worldScaleX;
		var scaleY = this.worldScaleY;

		// scale
		dx *= scaleX;
		dy *= scaleY;

		// translate
		var v = $V([ x+dx, y+dy ]);

		// rotate
		v = v.rotate(Math.rad(rotation),$V([x,y]));

		return vectorToPoint(v);
	};

	this.worldToLocalCoord = function(p){

		var x1 = p.x;
		var y1 = p.y;
		
		var x0 = this.worldX;
		var y0 = this.worldY;

		var rotation = this.worldRotation;
		var scaleX = this.worldScaleX;
		var scaleY = this.worldScaleY;

		// Translate
		var dx = x1-x0;
		var dy = y1-y0;

		// Scale down
		dx /= scaleX;
		dy /= scaleY;

		// dx,dy as a vector
		var v = $V([dx,dy]);

		// rotate back - around the origin
		v = v.rotate(Math.rad(-1*rotation),Vector.Zero(2));

		// point is now relative to worldX,worldY
		return vectorToPoint(v);
	};
};

Bone.root = new Bone('root');

var Vertex = function(bone,x,y){

	// new Vertex(x,y) - uses Bone.root
	if(typeof bone !== 'object'){
		y=x;
		x=bone;
		bone = Bone.root;
	}

	this.bone = bone;

	this.x = x || 0;
	this.y = y || 0;

	// live instance data
	this.worldX = 0;
	this.worldY = 0;

	// assumes bones have been updated
	this.updateWorldTransform = function(){

		var dx = this.x;
		var dy = this.y;

		//this.boneObject.updateWorldTransform(); // update bones first via skeleton
		var x = this.bone.worldX;
		var y = this.bone.worldY;
		var rotation = this.bone.worldRotation;
		var scaleX = this.bone.worldScaleX;
		var scaleY = this.bone.worldScaleY;

		// scale
		dx *= scaleX;
		dy *= scaleY;

		// translate
		var v = $V([ x+dx, y+dy ]);

		//console.log(x,y,dx,dy,v.inspect());

		// rotate
		v = v.rotate(Math.rad(rotation),$V([x,y]));

		//console.log(rotation,v.inspect());

		var p = vectorToPoint(v);

		this.worldX = p.x;
		this.worldY = p.y;
		
	};

	// doesn't return live instance data
	this.getData = function(){

		var o = {
			bone : bone.name ,
			x : this.x ,
			y : this.y ,
		};

		return o;
	};
};

// Graph
//
// graphData { name, vertices[ {bone,x,y} ] }

// Doesn't link bones automatically

var Graph = function(name){

	this.name = name || "Unnamed Graph";
	this.vertices = [];
	this.data = { name: this.name, vertices:[] };
	
	this.map = function(graphData){

		this.name = graphData.name;
		this.data = graphData;

		for(var i=0;i<graphData.vertices.length;i++){

			var o = graphData.vertices[i];
			var vertex = new Vertex(o.bone,o.x,o.y);

			this.vertices.push(vertex);
		}
	};

	// Add vertex returns the index
	this.addVertex = function(vertex){

		var index = this.findVertexIndex(vertex);

		if( index == -1){
			index = this.vertices.length;
			this.vertices.push(vertex);
			this.data.vertices.push(vertex.getData());
		}
		return index;
	};

	// NOTE - use add to keep graph & graph data in sync
	this.removeVertex = function(vertex){

		if(this.vertices.length != this.data.vertices.length){
			throw("Remove vertex failed: Graph doesn't match Graph Data!");
		}

		var index = this.findVertexIndex(vertex);

		if(index != -1){
			this.vertices.splice(index,1);
			this.data.vertices.splice(index,1);
		}else{
			console.error("Remove vertex: vertex not found in graph!");
		}
	};

	this.findVertexIndex = function(vertex){

		for(var i=0;i<this.vertices.length;i++){

			if(this.vertices[i] === vertex){
				return i;
			}
		}

		return -1;
	};

	// Update graph data if vertices have been manipulated directly - only for initial setup
	// this is effectively changing the initial state of the graph, so don't update when running an animation
	this.updateData = function(){

		this.data.vertices = [];

		for(var i=0;i<this.vertices.length;i++){
			this.data.vertices.push(this.vertices[i].getData());
		}

		return this.data;
	};

	this.updateWorldTransform = function(){

		for(var i=0;i<this.vertices.length;i++){
			this.vertices[i].updateWorldTransform();
		}
	};
};

var Shape = function(name, graph){
	
	// SHAPE Definition
	this.name = name || "Undefined Shape";
	this.graph = graph || new Graph('Undefined Graph');
	this.vertices = [];
	this.closedPath = false;
	this.hasStroke = true;
	this.hasFill = true;
	this.strokeStyle = '#333333';
	this.fillStyle = '#eeeeee';

	this.data = {
		name : this.name ,
		graph : this.graph.name ,
		vertices : [] ,
		closedPath : this.closedPath ,
		hasStroke : this.hasStroke ,
		hasFill : this.hasFill ,
		strokeStyle : this.strokeStyle ,
		fillStyle : this.fillStyle
	};

	// Animation
	//this.timeline = [];

	// Add vertex - adds from graph, or if not found, adds a new one to the graph
	this.addVertex = function(vertex){

		//var index = this.graph.findVertexIndex(vertex);
		//index = (index != -1) ? index : this.graph.addVertex(vertex);
		//this.vertexIndices.push(index);

		this.vertices.push(vertex);
		this.data.vertices.push( vertex.getData() );
	};

	// Remove vertex - deep = true, to also remove from the graph - problematic if duplicate vertex in shape- removes last
	this.removeVertex = function(vertex,deep){

		/*
		var index = this.graph.findVertexIndex(vertex);

		if(index != -1){
			var i = this.vertexIndices.lastIndexOf(index);
			if(i != -1) this.vertexIndices.splice(i,1);

			if(deep && this.vertexIndices.indexOf(index) == -1) this.graph.removeVertex(vertex);
		}
		*/

		// Find last index of
		for(var i=this.vertices.length;i>0;i--){
			var j = i-1;

			if(this.vertices[j] === vertex){
				this.vertices.splice(j,1);
				this.data.vertices.splice(j,1);
			}
		}
	};

	// Get vertex from the embedded graph
	this.getVertexByReference = function(ref_i){

		//var index = this.vertexIndices[ref_i];
		//return(this.graph.vertices[index]);
	};

	// Object functions
	this.updateData = function(){

		this.data = {

			name : this.name ,
			graph : this.graph.name ,
			closedPath : this.closedPath ,
			hasStroke : this.hasStroke ,
			hasFill : this.hasFill ,
			strokeStyle : this.strokeStyle ,
			fillStyle : this.fillStyle
		};

		this.data.vertices = [];
		for(var i=0;i<this.vertices.length;i++){

			this.data.vertices.push( this.vertices[i].getData() );
		}

		return this.data;
	};

	// Optional to include graph, or will use current
	this.map = function(data,graph){

		if(typeof graph !== 'undefined'){
			// copy values to preserve bindings
			this.graph.map(graph.data);
		}

		this.name = data.name;
		this.vertices = [];
		this.closedPath = data.closedPath;
		this.hasStroke = data.hasStroke;
		this.hasFill = data.hasFill;
		this.strokeStyle = data.strokeStyle;
		this.fillStyle = data.fillStyle;

		this.data = data;
		
		for(var i=0;i<data.vertices.length;i++){

			var o = data.vertices[i];
			var vertex = new Vertex(o.bone,o.x,o.y);

			this.vertices.push(vertex);
		}
	};

};

var Stage = function(theCanvas){

	"use strict";

	var stage = this;

	// PUBLIC 

	this.debug = false;

	this.mode = "PLOT";
	this.timeIndex = 0;

	// Default graph
	this.graph = new Graph('Stage graph');

	// Holds all shapes
	this.shapes = [];
	this.currentShape = null;

	// PROTECTED

	var canvas = theCanvas;
	var c = canvas.getContext('2d');

	// Path manipulation
	var selectedVertex = null;

	// Timeline manipulation
	var timer;

	// Tool handlers
	this.tool = {
		PLOT: {} ,
		MOVE: {} ,
		DRAG: {} ,
		DELETE: {},
		INSERT: {}
	};

	this.clear = function(){

		//stage.shape.vertices = [];
	};

	// PLOT relative to bone!
	this.plot = function(p){

		// relative to root bone -- for now, should use selected bone ***** TODO
		var localPt = Bone.root.worldToLocalCoord(p);
		var vertex = new Vertex(localPt.x,localPt.y);
		this.currentShape.addVertex(vertex);
	};

	this.addShape = function(){

		// Store the current buffer in the top shape stack
		//var last_i = this.shapes.length-1;
		//this.shapes[last_i].map(this.shape);

		// Create a new shape & push on stack
		var name = 'shape_'+this.shapes.length;
		var newShape = new Shape(name,this.graph);
		this.shapes.push(newShape);

		// Load into the buffer - done this way mainly for debugging
		//this.shape.map(newShape);

		this.currentShape = newShape; // point to the new shape

		return newShape;
	};

	// init the current shape
	this.addShape();

	this.setCurrentShape = function(name){

		var found = false;

		for(var i=0;i<this.shapes.length;i++){

			if(this.shapes[i].name == name){
				this.currentShape = this.shapes[i];
				found=true;
				break;
			}
		}

		if(!found) console.error("Stage.setCurrentShape - No such shape named: "+name);
	};

	this.update = function(){

		// Clear the canvas
		c.clearRect(0, 0, canvas.width, canvas.height);
		c.fillStyle = "#fff";
		c.fillRect(0,0,canvas.width,canvas.height);

		// store current buffer
		//var shape = stage.shapes.pop();
		//shape.map(stage.shape);
		//stage.shapes.push(shape);


		stage.shapes.forEach(function(shape){

			//stage.shape.map(shape);
		
			// Draw the shape
			c.strokeStyle = shape.strokeStyle;
			c.fillStyle = shape.fillStyle;

			c.beginPath();

			var vertex = shape.getVertexByReference(0);
			if(typeof vertex !== 'undefined'){

				vertex.updateWorldTransform();
				var p = { x : vertex.worldX , y : vertex.worldY };

				//console.log(JSON.stringify(p));
				c.moveTo(p.x,p.y);

				for(var i=1;i<shape.vertexIndices.length;i++){

					vertex = shape.getVertexByReference(i);
					vertex.updateWorldTransform();
					p = { x : vertex.worldX , y : vertex.worldY };

					//console.log(JSON.stringify(p));
					c.lineTo(p.x,p.y);
				}

				if(shape.closedPath) c.closePath();
				if(shape.hasFill) c.fill();
				if(shape.hasStroke) c.stroke();
			
				for(i=0;i<shape.vertexIndices.length;i++){

					vertex = shape.getVertexByReference(i);
					p = { x : vertex.worldX , y : vertex.worldY };

					c.fillStyle = 'rgba(0,255,0,0.3)';
					if(vertex === selectedVertex){
						c.fillStyle = 'rgb(0,0,255)';
					}

					c.fillRect(p.x-4,p.y-4,8,8);
				}
			}

				// Test entire canvas - - - 
/*
				if(stage.debug){
					c.fillStyle = 'rgba(255,255,0,0.4)';
					for(var x = 0;x<canvas.width;x++){
						for(var y=0;y<canvas.height;y++){
							if(edgeContainsPoint(x,y) != -1){

								c.fillRect(x,y,1,1);
							}
						}
					}
				}
*/
		});
	};

	// 
	// ANIMATION control
	//

	this.addKeyframe = function(){

		for(var i=0;i<stage.shape.vertices.length;i++){

			var p = stage.shape.vertices[i];

			var keyframe = {

				time: stage.timeIndex ,
				x : p.x ,
				y : p.y
			};

			if(typeof stage.shape.timeline[i] === 'undefined') stage.shape.timeline[i] = [];

			// timeline per vertex
			stage.shape.timeline[i].push(keyframe);

			// sort by time index
			stage.shape.timeline[i].sort( function(k1,k2){ return k1.time - k2.time; } );
		}

		//console.log(JSON.stringify(timeline));
	};

	this.next = function(){
		stage.timeIndex++;
		stage.timeIndex = (stage.timeIndex < 1000)?stage.timeIndex:0;
		updateVertices();
		stage.update();
	};

	this.prev = function(){
		stage.timeIndex--;
		stage.timeIndex = (stage.timeIndex > -1)?stage.timeIndex:999;

		updateVertices();
		stage.update();
	};

	this.rewind = function(){
		stage.timeIndex = 0;
		updateVertices();
		stage.update();
	};

	this.play = function(){

		console.log('Play.');

		stage.timeIndex = 0;

		clearInterval(timer);
		timer = setInterval(function(){

			updateVertices();
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

		for(var i=0;i<timeline.length;i++){

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

		selectedVertex = closestPointOnPath(stage.shape.vertices,x,y);
		console.log("selected vertex",selectedVertex);
	};

	this.tool.MOVE.handleMouseMove = function(x,y,dx,dy){

		if(selectedVertex){

			selectedVertex.x = x;
			selectedVertex.y = y;
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
			stage.shape.vertices.forEach(function(p){
				p.x -= dx;
				p.y -= dy;
			});
		}
	};

	this.tool.DRAG.handleMouseUp = function(x,y){
		stage.tool.DRAG.dragStart = false;
	};

	// DELETE - - - -

	this.tool.DELETE.handleClick = function(x,y){

		var p = closestPointOnPath(stage.shape.vertices,x,y);
		
		// inefficient because we looped through vertices once already
		for(var i=0;p && i<stage.shape.vertices.length;i++){

			if(stage.shape.vertices[i] === p){
				stage.shape.vertices.splice(i,1);
				p = null; // just to end the loop
			}
		}
	};

	// INSERT - - - -

	this.tool.INSERT.handleClick = function(x,y){
		
		var start = edgeContainsPoint(stage.shape.vertices,x,y);
		if(start != -1){

			console.log("On the line!");
			// insert after the starting vertex
			var p = stage.shape.vertices[start];
			stage.shape.vertices.splice(start,1,p,{x:x,y:y}); // add it after the start point
		}
	};

	// TOOL Utility functions = = = =

// closestPointOnPath - returns the topmost match in the path array

	function closestPointOnPath(vertices,x,y){

		var o = null;

		vertices.forEach(function(p){

			var dist = Math.sqrt( Math.pow(p.x-x,2) + Math.pow(p.y-y,2) );

			if(dist < 8){

				// exact point, not a clone
				o = p;

				console.log("Found vertex",p);
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
				//c.fillStyle = '#f00';
				//return i;
			}else{
				//c.fillStyle = '#0f0';
			}

			var edge = $V( [ p1.x - p0.x, p1.y - p0.y ] );
			var edgeUnit = edge.toUnitVector();
			var direction = $V( [ x - p0.x, y - p0.y ] );

			var projection = edgeUnit.multiply( direction.modulus() );

			if( edge.modulus()-projection.modulus() > -1  && direction.distanceFrom(projection) < 8 ){

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
		var dx = trackMouseEvent.lastX - x;
		var dy = trackMouseEvent.lastY - y;

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
