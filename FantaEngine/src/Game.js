//
// Game.js - State manager and properties
//

// TODO - - - -
// GAME should hold other classes - Stage, EventManager, Loader
// and init function?

// Stage & Game communicate via event manager
// Load scenes via Loader

function Game(){

	// PROTECTED
	var game = this;  // this is an evil thing
	var isRunning = false;

	// temporary hack
	this.canvas = document.getElementById('myCanvas');

	// PUBLIC
	this.stage = new Stage(this.canvas);
	this.eventManager = new EventManager();
	this.loader = new Loader();

	// Lookup tables
	this.assets = {};
	this.colors = {};

	// Components
	this.scenes = [];
	this.currentScene = null;

	this.encounters = [];
	this.currentEncounter = null;

	this.mode = "SCENE"; // SCENE, INVENTORY/PLACE_OBJECT (?) or ENCOUNTER

	this.addColor = function(name,style){
		this.colors[name] = style;
	};

	this.getColor = function(name){

		var style = this.colors[name] || "rgba(255,0,0,0.5)";
		return style;
	};

	this.addScene = function(scene){

		scene.game = game;

		if(game.scenes.indexOf(scene) === -1){
			console.log("Game: Adding new scene,",scene.name);
			scene.load();
			game.scenes.push(scene);
		}

		if(game.currentScene === null) game.currentScene = scene;
	};

	// MAKING PROTECTED - trigger via event!
	var gotoScene = function(sceneName){

		game.eventManager.finished('gotoScene');

		for(var i=0;i<game.scenes.length;i++){
			var scene = game.scenes[i];

			if(scene.name == sceneName){
				if(game.currentScene) game.currentScene.unload();
				game.currentScene = scene;
				game.currentScene.load();
				game.mode = "SCENE";
				return scene;
			}
		}
		return null;
	};

	this.addEncounter = function(encounter){

		encounter.game = game;

		if(game.encounters.indexOf(encounter) === -1){
			console.log("Game: Adding new encounter,",encounter.name);
			encounter.load();
			game.encounters.push(encounter);
		}

	};

	// PROTECTED !!!
	var startEncounter = function(encounterName){

		for(var i=0;i<game.encounters.length;i++){
			var encounter = game.encounters[i];

			if(encounter.name == encounterName){
				if(game.currentEncounter) game.currentEncounter.unload();
				game.currentEncounter = encounter;
				game.currentEncounter.load();
				game.mode = "ENCOUNTER";
				return encounter;
			}
		}
		return null;
	};

	this.start = function(){

		console.log("\n\nStarting game...\n");

		// ADD EVENT HANDLERS for SCENE & ENCOUNTER
		game.eventManager.on("gotoScene",gotoScene,game);
		game.eventManager.on("startEncounter",startEncounter,game);


		requestAnimationFrame(game.update);
	};

	this.update = function(){
		// Update animation timer
		game.eventManager.send('Tick',Date.now(),game);
		requestAnimationFrame(game.update);
	};

	// EVENT HANDLER - click/drag by STATE --- TO DO - drag events
	// put these handlers in the STAGE!!! TODO

	var canvas = game.canvas;
	canvas.addEventListener('click',clickHandler,true);

	function clickHandler(e){
		var event = {};
		event.x = e.clientX;
		event.y = e.clientY;

		console.log("Clicked at:",event.x,event.y);

		switch(game.mode){

			case "SCENE":
				game.eventManager.send('click:'+game.currentScene.name,event,game);
				break;
			case "ENCOUNTER":
				game.eventManager.send('click:'+game.currentEncounter.name,event,game);
				break;
			default:
				console.log("Do nothing for mode:",game.mode);
		}
	}
}

// holds properties - the saveable game state
Game.prototype.properties = {

	//foo : "bar" ,
	//kit : "kat"

};

Game.prototype.setProperty = function(name,value){

	this.properties[name] = value;
};

Game.prototype.getProperty = function(name){

	return this.properties[name];
};

