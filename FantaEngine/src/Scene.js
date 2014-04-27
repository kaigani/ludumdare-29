//
// Scene.js
//

function ClickRegion(poly,handler){
	this.poly = poly;
	this.handler = handler;
}

(function(window){

	'use strict';

window.Scene = function Scene(name){

	var scene = this;
	this.identity = function(){ return scene; };

	this.game = null; // needs a parent - link via game.addScene method
	this.name = name || "Unnamed Scene";

	this.background = null; // image or canvas

	this.floorPoly = [];
	this.clickRegions = [];

	// start position for player - what about other object points? spawn points? 
	this.playerStart = {x:200,y:400};
	this.player = {x:200,y:400}; // temporary measure?

	// Scene click handler - find out the click is in a region
	// Will trigger the most recent clickRegion pushed on to the list
	this.clickHandler = function(e){

		console.log("* * * * Clickhandler called in scene",scene.name);

		var foundHandler = null;

		for(var n=scene.clickRegions.length;n>0;n--){

			var i = n-1;
			var clickRegion = scene.clickRegions[i];

			if(polygonContainsPoint(clickRegion.poly,e.x,e.y)){
				foundHandler = clickRegion.handler;
				break;
			}
		}

		if(foundHandler){

			foundHandler(e);

		}else if(polygonContainsPoint(scene.floorPoly,e.x,e.y)){

			scene.game.eventManager.queue("MoveTo",e,scene,true); // interrupt previous moves
		}
	};
};

// Load the scene - register the event handlers
Scene.prototype.load = function(){

	console.log("Load Scene",this.name);

	this.game.eventManager.on('click:'+this.name,this.clickHandler,this);

};

// Remove the event handlers -- not really necessary as they're all tagged with the scene name
Scene.prototype.unload = function(){

	console.log("Unload scene",this.name);

	//this.game.eventManager.remove('click:'+this.name,this.clickHandler);
	this.game.eventManager.release(this);
	this.game.eventManager.clear(); // remove any queued events

};

Scene.prototype.addClickRegion = function(poly,eventData){

	var scene = this;

	console.log("%%% ADDING EVENT HANDLERS %%%");
	console.log(scene);
	var handler = function(e){
		console.log("\n\n\nJUST THROW THIS!!!!!!!!\n\n\n");
		scene.game.eventManager.queue(eventData.event,eventData.data,scene,true); // interrupt any other clicks
	};

	var region = new ClickRegion(poly,handler);
	this.clickRegions.push(region);
};


// helper function
function drawPoly(c,polygon,strokeStyle,fillStyle){

	if(!polygon) return;

	c.strokeStyle = strokeStyle;
	c.fillStyle = fillStyle;

	c.beginPath();
	c.moveTo(polygon[0],polygon[1]);

	for(var ii = 2;ii<polygon.length;ii+=2){
		c.lineTo(polygon[ii],polygon[ii+1]);
		//console.log(ii);
	}
	c.closePath();
	c.fill();
	c.stroke();
}

// This will move to the stage, but for testing...
Scene.prototype.render = function(canvas){

	var c = canvas.getContext('2d');
//var playerImage = game.loader.getFile('assets/img/player.png');
	if(this.background) c.drawImage(this.background,0,0,canvas.width,canvas.height);

	// Draw the floor polygon
	drawPoly(c,this.floorPoly,"#0f0","rgba(0,255,0,0.1);");

	// Draw click regions
	for(var i=0;i<this.clickRegions.length;i++){

		var clickRegion = this.clickRegions[i];
		drawPoly(c,clickRegion.poly,"#00f","rgba(0,0,255,0.2);");
	}

	// Draw the player
	c.fillStyle = game.getColor('pattern-01');
	c.beginPath();
	c.moveTo(this.player.x-40,this.player.y);
	c.lineTo(this.player.x,this.player.y-120);
	c.lineTo(this.player.x+40,this.player.y);
	c.closePath();
	c.fill();

};

})(window);

