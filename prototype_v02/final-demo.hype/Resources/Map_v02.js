
window.Map = function Map(){

	this.root = null;
	this.rooms = [];
	this.spawnPoints = [];
};


Map.prototype.generateMap = function(maxDepth){

	var map = this;

	this.root = this.recursiveGenerateMap(maxDepth);

	// MAKE SURE ALL ROOM CONNECTIONS ARE SYMMETRIC
	for(var i=0;i<map.rooms.length;i++){

		var room = map.rooms[i];

		if(room.north) room.north.south = room;
		if(room.south) room.south.north = room;
		if(room.west) room.west.east = room;
		if(room.east) room.east.west = room;
	}

	// MEASURE DISTANCE FROM ROOT
	function rootWalk(node,depth){
		depth = depth || 0;

		if(!node) return depth;

		var max = depth;

		if(!node.getProperty('depth')){
			node.setProperty('depth',depth);

			max = Math.max(max,rootWalk(node.north,depth+1));
			max = Math.max(max,rootWalk(node.south,depth+1));
			max = Math.max(max,rootWalk(node.west,depth+1));
			max = Math.max(max,rootWalk(node.east,depth+1));
		}
		
		return max;
	}

	var deepest = rootWalk(this.root);
	console.log("MAX found=",deepest-1);

	return this.root;
};

// only success when we hit the maxDepth
Map.prototype.recursiveGenerateMap = function(maxDepth,x,y,depth){

	maxDepth = maxDepth || 4;
	x = x || 0;
	y = y || 0;
	depth = depth || 0;

	//console.log("x:",x,",y:",y,"\tAt depth:",depth);

	if(depth > maxDepth) return;

	var room = this.lookupCoordinates(x,y);
	if(room === null){
		//console.log(room);
		room = new Room("Temp",x,y);
		room.name = 'Room_' + room.id;
		this.rooms.push(room);
	}else{
		console.log("HIT existing room:",room.name);
		//return room;
	}

	if(depth == maxDepth){
		console.log("Success! AT MAX DEPTH",room);
		//this.rooms.push(room);
		room.setProperty('spawnPoint',true);
		this.spawnPoints.push(room);
		return room;
	}

	//var nExits = Math.floor(Math.random()*3 + 2); // 2-4 exits
	var nExits = 4;
	//console.log("New room [",room.name,"] has",nExits,"exits");

	var directions = [];

	if(this.lookupCoordinates(x,y-1)){
		nExits--;
	}else{
		directions.push('north');
	}
	if(this.lookupCoordinates(x,y+1)){
		nExits--;
	}else{
		directions.push('south');
	}
	if(this.lookupCoordinates(x-1,y)){
		nExits--;
	}else{
		directions.push('west');
	}
	if(this.lookupCoordinates(x+1,y)){
		nExits--;
	}else{
		directions.push('east');
	}

	//for(var i=0;i<nExits;i++){

	if(directions.length > 0){

		var rand_i = Math.floor(Math.random()*directions.length);

		var direction = directions[rand_i];
		directions.splice(rand_i,1);

		//console.log("\tAdding direction",direction);

		switch(direction){
			case 'north':
				room[direction] = this.recursiveGenerateMap(maxDepth,x,y-1,depth+1);
				break;
			case 'south':
				room[direction] = this.recursiveGenerateMap(maxDepth,x,y+1,depth+1);
				break;
			case 'west':
				room[direction] = this.recursiveGenerateMap(maxDepth,x-1,y,depth+1);
				break;
			case 'east':
				room[direction] = this.recursiveGenerateMap(maxDepth,x+1,y,depth+1);
				break;
			default:
				console.warn("No such direction:",direction);
		}
	}

	return room;

};

Map.prototype.lookupCoordinates = function(x,y){

	for(var i=0;i<this.rooms.length;i++){
		
		var room = this.rooms[i];
		if(room.x === x && room.y === y){
			//console.log("\t\tFound room at",x,y);
			return room;
		}
	}

	return null;
};

Map.prototype.debug = function(){

	for(var i=0;i<this.rooms.length;i++){
		console.log(JSON.stringify(this.rooms[i].getProperties()));
	}
};

var roomCount = 0;

function Room(name,x,y){

	this.name = name || "Unnamed Room";
	this.id = ++roomCount;

	this.x = x; // relative coordinates
	this.y = y;

	// PROTECTED
	var properties = {};

	// Holder for other room objects
	this.north = null;
	this.south = null;
	this.west = null;
	this.east = null;

	this.countExits = function(){
		var n = 0;
		if(this.north) n++;
		if(this.south) n++;
		if(this.west) n++;
		if(this.east) n++;

		return n;
	};

	this.setProperty = function(name,value){
		properties[name] = value;
		//console.log(properties);
	};

	this.getProperty = function(name){
		return properties[name];
	};

	this.getProperties = function(){
		return properties;
	};

	// Views
	// -----
	// 0 = open, open, open
	// 1 = open, open, closed
	// 2 = open, closed, open
	// 3 = open, closed, closed
	// 4 = closed, open, open
	// 5 = closed, open, closed
	// 6 = closed, closed, open
	// 7 = closed, closed, closed

	// Note that 1 & 4 and 3 & 6 mirror each other horizontally

	// I could use binary operations if I remembered how

	this.getView = function(heading){

		console.log(heading,this.north,this.south,this.west,this.east);

		var value = 0;
		if(heading === 'north'){

			if(this.west == Room.isWall) value += 4;
			if(this.north == Room.isWall) value += 2;
			if(this.east == Room.isWall) value += 1;
		}else
		if(heading === 'south'){

			if(this.east == Room.isWall) value += 4;
			if(this.south == Room.isWall) value += 2;
			if(this.west == Room.isWall) value += 1;
		}else
		if(heading === 'west'){

			if(this.south == Room.isWall) value += 4;
			if(this.west == Room.isWall) value += 2;
			if(this.north == Room.isWall) value += 1;
		}else
		if(heading === 'east'){

			if(this.north == Room.isWall) value += 4;
			if(this.east == Room.isWall) value += 2;
			if(this.south == Room.isWall) value += 1;
		}

		return value;
	};
}

Room.isWall = null; // no room exists to enter