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

	this.map = function(data, overwrite){

		this.name = overwrite ? data.name : this.name;
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

// VERTEX
// closure for reference counting
(function(window){

var referenceCount = 0;

var Vertex = function(bone,x,y){

	// New vertex from a vertex
	if(bone instanceof Vertex){

		var vertex = bone;

		bone = vertex.bone;
		x = vertex.x;
		y = vertex.y;
	}
	// new Vertex(x,y) - uses Bone.root
	else if(typeof bone !== 'object'){
		console.warn('Vertex created with Bone.root by default');
		y=x;
		x=bone;
		bone = Bone.root;
	}

	this.id = referenceCount++; // need to overwrite if instantiating from graph data
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

	// doesn't return live instance data - worldX,worldY
	this.getData = function(){

		var o = {
			id : this.id ,
			bone : bone.name ,
			x : this.x ,
			y : this.y ,
		};

		return o;
	};
};

window.Vertex = Vertex;

})(window);
// end VERTEX class

var Shape = function(name){
	
	// SHAPE Definition
	this.name = name || "Undefined Shape";
	this.vertices = [];
	this.closedPath = false;
	this.hasStroke = true;
	this.hasFill = true;
	this.strokeStyle = '#333333';
	this.fillStyle = '#eeeeee';

	this.data = {
		name : this.name ,
		vertices : [] ,
		closedPath : this.closedPath ,
		hasStroke : this.hasStroke ,
		hasFill : this.hasFill ,
		strokeStyle : this.strokeStyle ,
		fillStyle : this.fillStyle
	};

	// Animation
	//this.timeline = [];

	// Add vertex 
	this.addVertex = function(vertex){

		this.vertices.push(vertex);
		this.data.vertices.push( vertex.getData() );
	};

	// Remove vertex 
	this.removeVertex = function(vertex){

		// Find last index of
		for(var i=this.vertices.length;i>0;i--){
			var j = i-1;

			if(this.vertices[j] === vertex){
				this.vertices.splice(j,1);
				this.data.vertices.splice(j,1);
			}
		}
	};

	// Object functions
	this.updateData = function(){

		this.data = {

			name : this.name ,
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

	// includes a vertexList for export
	this.getData = function(){

		var data = this.updateData();
		data.vertexList = [];

		for(var i=0;i<this.vertices.length;i++){
			data.vertexList.push(this.vertices[i].id);
		}

		return data; // be careful not to change this or it will change active data
	};

	// Maps either Shape or Object data - object will have vertices stored as { name, x, y }
	// overwrite = true to overwrite name, duplicates vertices
	// overwrite = false - to clone- including exact vertices!
	this.map = function(data,overwrite){

		this.name = (overwrite)?data.name:this.name; // true to overwrite name
		this.vertices = [];
		this.closedPath = data.closedPath;
		this.hasStroke = data.hasStroke;
		this.hasFill = data.hasFill;
		this.strokeStyle = data.strokeStyle;
		this.fillStyle = data.fillStyle;
		
		for(var i=0;i<data.vertices.length;i++){

			var vertex = data.vertices[i];
			vertex = (overwrite && vertex instanceof Vertex)?vertex:new Vertex(vertex.bone,vertex.x,vertex.y);
			//if(o instanceof Shape) o = o.getData(); // when does this happen?? *** remove

			this.vertices.push(vertex);
		}

		// Update this.data
		this.updateData();
	};

};


// GRAPH is the vertex data for all shapes
(function(window){

var Graph = function(name){

	this.name = name || "Unnamed Graph";
	this.vertices = [];
	this.shapes = [];

	// data represents the setup condition
	this.data = {
		name : name ,
		vertices : [],
		shapes : []
	};

	// Add shapes to the graph
	this.addShapes = function(shapes){

		// there is probably a faster way to insert these ... binary search by id?
		for(var i=0;i<shapes.length;i++){

			var shape = shapes[i];
			this.addShape(shape);
		}
	};

	// Add shape to the graph
	this.addShape = function(shape){

		if(this.shapes.indexOf(shape) == -1){
			this.shapes.push(shape);
			this.addVertices(shape.vertices);
		}

		this.updateData();
	};

	// Find a shape
	this.findShape = function(name){
		
		for(var i=0;i<this.shapes.length;i++){

			var shape = this.shapes[i];

			if(shape.name == name){
				return shape;
			}
		}

		return null;
	};

	// update shapes in case vertices have changed within shapes
	// overwrite - clears all vertices, otherwise adds to buffer
	this.updateShapes = function(overwrite){

		if(overwrite){
			this.vertices = [];
			this.data.vertices = [];
		}

		for(var i=0;i<this.shapes.length;i++){

			var shape = this.shapes[i];
			this.addVertices(shape.vertices);
		}
	};

	// Add an array of vertices
	this.addVertices = function(vertices){

		for(var i=0;i<vertices.length;i++){

			var vertex = vertices[i];

			if(this.vertices.indexOf(vertex) == -1){
				this.vertices.push(vertex);
			}
		}
	};

	// Find vertex by id
	this.findVertex = function(id){

		for(var i=0;i<this.vertices.length;i++){
			var vertex = this.vertices[i];
			if(id == vertex.id) return vertex;
		}

		return null;
	};

	// Update data, abbreviates shapes to vertexList, rather than storing vertices twice
	this.updateData = function(){

		this.updateShapes();

		this.data.name = this.name;
		this.data.vertices = [];
		this.data.shapes = [];

		for(var i=0;i<this.vertices.length;i++){
			var vertex = this.vertices[i];
			this.data.vertices.push(vertex.getData());
		}

		for(i=0;i<this.shapes.length;i++){
			var shapeData = this.shapes[i].getData();

			var o = {
				"name": shapeData.name,
				"closedPath": shapeData.closedPath,
				"hasStroke": shapeData.hasStroke,
				"hasFill": shapeData.hasFill,
				"strokeStyle": shapeData.strokeStyle,
				"fillStyle": shapeData.fillStyle,
				"vertexList": shapeData.vertexList
			};

			this.data.shapes.push(o);
		}

		return this.data;
	};

	// changing the API - should use getData rather than direct access to graph.data
	this.getData = function(){

		this.updateData();

		return this.data;
	};

	// Map & instantiate graph from a graph data 
	// Creates all vertices & shapes anew
	// overwrite = true - copy name
	this.map = function(graphData,overwrite){

		this.name =  overwrite ? graphData.name : this.name;
		this.vertices = [];
		this.shapes = [];

		var verticesData = graphData.vertices;
		var shapesData = graphData.shapes;

		//console.log('\t',verticesData,shapesData);

		var bone,vertex,shape;

		// Add vertices
		for(var i=0;i<verticesData.length;i++){

			var vertexData = verticesData[i];
			bone = new Bone(vertexData.bone); // TODO ** remap these bones from a skeleton

			vertex = new Vertex(bone,vertexData.x,vertexData.y);
			vertex.id = vertexData.id;

			this.vertices.push(vertex);
		}

		// Add shapes
		for(i=0;i<shapesData.length;i++){

			var shapeData = shapesData[i];
			shape = new Shape(shapeData.name);

			shape.closedPath = shapeData.closedPath;
			shape.hasStroke = shapeData.hasStroke;
			shape.hasFill = shapeData.hasFill;
			shape.strokeStyle = shapeData.strokeStyle;
			shape.fillStyle = shapeData.fillStyle;

			for(var j=0;j<shapeData.vertexList.length;j++){
				var id = shapeData.vertexList[j];
				vertex = this.findVertex(id);
				shape.addVertex(vertex);
			}

			shape.updateData();

			this.shapes.push(shape);
		}

		// Update data
		this.updateData();
	};

	this.mapBones = function(skeleton){
		// TODO
	};

};

window.Graph = Graph;

})(window);









