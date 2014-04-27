//
// Encounter.js
//

// Very much like a scene, but more structured for dialogue between 2 characters

function Encounter(name){

	var encounter = this;
	this.identity = function(){ return encounter; };

	this.game = null; // needs a parent - link via game.addEncounter method
	this.name = name || "Unnamed Encounter";

	this.npc = null; // placeholder for NPC

	this.options = []; // clickRegions for options
	this.confirmButton = null; //clickRegion for confirmation button
	this.cancelButton = null; // clickRegion for cancel button -- or assume that any missed click is a cancel

	// Encounter click handler - find out the click is in a region
	// Will trigger if an option or a confirmation button
	// **** REMEMBER 'this' loses its reference on a callback!!!
	this.clickHandler = function(e){

		console.log("Encounter click handler for",encounter.name);

		var foundHandler = null;

		for(var n=encounter.options.length;n>0;n--){

			var i = n-1;
			var option = encounter.options[i];

			if(polygonContainsPoint(option.poly,e.x,e.y)){
				foundHandler = option.handler;
				break;
			}
		}

		if(foundHandler){
			foundHandler(e);
		}else if(encounter.confirmButton !== null && polygonContainsPoint(encounter.confirmButton.poly,e.x,e.y)){

			encounter.confirmButton.handler();

		}else if(encounter.cancelButton !== null && polygonContainsPoint(encounter.cancelButton.poly,e.x,e.y)){

			encounter.cancelButton.handler();
		}
	};
}

// Load the encounter - register the event handlers
Encounter.prototype.load = function(){

	console.log("Load Encounter",this.name);

	this.game.eventManager.on('click:'+this.name,this.clickHandler,this);

};

// Remove the event handlers 
Encounter.prototype.unload = function(){

	console.log("Unload encounter",this.name);

	this.game.eventManager.release(this);
	this.game.eventManager.clear(); // remove any queued events

};

Encounter.prototype.addOption = function(poly,eventData){

	var encounter = this;

	var handler = function(e){
		encounter.game.eventManager.queue(eventData.event,eventData.data,encounter);
	};

	var region = new ClickRegion(poly,handler);
	this.clickRegions.push(region);
};

Encounter.prototype.setConfirmButton = function(poly,eventData){

	var encounter = this;

	var handler = function(e){
		encounter.game.eventManager.queue(eventData.event,eventData.data,encounter);
	};

	var region = new ClickRegion(poly,handler);
	this.confirmButton = region;
};

Encounter.prototype.setCancelButton = function(poly,eventData){

	var encounter = this;

	var handler = function(e){
		encounter.game.eventManager.queue(eventData.event,eventData.data,encounter);
	};

	var region = new ClickRegion(poly,handler);
	this.cancelButton = region;
};

// This will move to the stage, but for testing...
Encounter.prototype.render = function(canvas){

	var c = canvas.getContext('2d');

	// Polygon
	/*
	this.floorPoly = [

		10,10,
		60,10,
		100,100,
		40,130,
		200,140,
		100,200,
		160,60
	];
	*/

	// Draw the background overlay
	c.fillStyle = "rgba(0,0,0,0.5)";
	c.fillRect(0,0,canvas.width,canvas.height);

	// Draw characters
	
	var playerImage = game.loader.getFile('assets/img/player.png');
	var npcImage = game.loader.getFile('assets/img/npc.png');

	c.drawImage(playerImage,70,canvas.height-500);
	c.drawImage(npcImage,canvas.width-270,canvas.height-500);

	// Draw modal at bottom
	c.fillStyle = "rgba(255,255,255,0.9)";
	c.fillRect(100,canvas.height-320,canvas.width-200,300);

	// Render text
	c.fillStyle = 'orangered';
	c.textBaseline = 'top';
	var phrase = 'Keyboard Cat is the dope diggy bro it is like cameo is winning bruv and that is so funny innit';

	c.fillParagraph(phrase,24,"DOS_2",120,canvas.height-300,canvas.width-220);

	// Draw the buttons - if any
	c.fillStyle = "#00f";
	c.fillText("OK",this.confirmButton.poly[0],this.confirmButton.poly[1]);
	
};

