window.App = function App(){

	var map = new Map();
	HVC.map = map;

	// where the player starts
	var root;

	canvas = document.createElement('canvas');
	// full-size canvas
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;

	document.body.appendChild(canvas);

	//c = canvas.getContext('2d');

	var stage = new Stage(canvas);
	HVC.stage = stage;

// INIT MAP

	for(var i=0;i<3;i++){
		root=map.generateMap(64);
		root.setProperty('root',true);
		console.log(map.spawnPoints.length);
	}

	for(var count=0;map.spawnPoints.length < 3 && count < 1000;count++){
		var rand_i = Math.floor(Math.random()*map.rooms.length);
		var room = map.rooms[rand_i];
		if(room.getProperty('depth') > 20){
			room.setProperty('spawnPoint',true);
			map.spawnPoints.push(room);
		}
	}

// DRAW MAP
	stage.drawMap(map);

// PLAYER MANAGEMENT

	var player = {};
	player.heading = 'north';
	player.room = map.root;

	HVC.setProperty('player',player);

	function playerStartHandler(event){

		console.log("Player saw",event.type,"event",event.detail);
		console.log("Send a view event back.");

		var player = HVC.getProperty('player');
		var map = HVC.map;

		var frameView = player.room.getView(player.heading);
		console.log("Frame view: ",frameView);

		HVC.eventManager.send('playerView',frameView);
	}

	function playerMoveHandler(event){

		console.log("\n\nPlayer saw",event.type,"event",event.detail);
		console.log("MOVE");

		var player = HVC.getProperty('player');
		var map = HVC.map;

		var move = player.heading+':'+event.detail;
		var next = player.heading;

		switch(move){

			case 'north:forward':
				next = 'north';
				player.heading = 'north';
				break;
			case 'north:left':
				next = 'west';
				player.heading = 'west';
				break;
			case 'north:right':
				next = 'east';
				player.heading = 'east';
				break;
			case 'north:back':
				next = 'south';
				player.heading = 'south';
				break;

			case 'south:forward':
				next = 'south';
				player.heading = 'south';
				break;
			case 'south:left':
				next = 'east';
				player.heading = 'east';
				break;
			case 'south:right':
				next = 'west';
				player.heading = 'west';
				break;
			case 'south:back':
				next = 'north';
				player.heading = 'north';
				break;

			case 'west:forward':
				next = 'west';
				player.heading = 'west';
				break;
			case 'west:left':
				next = 'south';
				player.heading = 'south';
				break;
			case 'west:right':
				next = 'north';
				player.heading = 'north';
				break;
			case 'west:back':
				next = 'east';
				player.heading = 'east';
				break;

			case 'east:forward':
				next = 'east';
				player.heading = 'east';
				break;
			case 'east:left':
				next = 'north';
				player.heading = 'north';
				break;
			case 'east:right':
				next = 'south';
				player.heading = 'south';
				break;
			case 'east:back':
				next = 'west';
				player.heading = 'west';
				break;

			default:
				console.warn("Can't move for the command:",move);
		}

		if(player.room[next]){
			player.room = player.room[next];
		}else{
			console.warn("Illegal player move:",move);
		}

		var frameView = player.room.getView(player.heading);
		console.log("Frame view: ",frameView);

		stage.updateMap(map);

		HVC.eventManager.send('playerView',frameView);

	}


	//console.log(HVC);
	//console.log(HVC.eventManager);
	//console.log(HVC.eventManager.addEventListener);
	HVC.eventManager.addEventListener('playerStart',playerStartHandler);
	HVC.eventManager.addEventListener('playerMove',playerMoveHandler);

};