var Stage = function(aCanvas){

	var stage = this;

	var canvas = aCanvas;
	var c = canvas.getContext('2d');


	this.drawMap = function(map){

		var start_x = canvas.width/2-10;
		var start_y = canvas.height/2-10;


		// Clear the canvas
		c.fillStyle = 'rgb(128,128,128)';
		c.fillRect(0, 0, canvas.width, canvas.height);

		var x,y;
		
		// Draw the rooms
		for(var i = 0;i<map.rooms.length;i++){

			var room = map.rooms[i];

			x = start_x+room.x * 20;
			y = start_y+room.y * 20;

			c.fillStyle = 'rgba(0,255,0,0.3)';
			c.stroke.style = 'rgb(255,255,255)';
			c.fillRect(x,y,20,20);
			c.strokeRect(x,y,20,20);

			c.fillStyle = 'rgb(255,255,0)';
			if(room.north) c.fillRect(x+8,y-2,4,4);
			if(room.south) c.fillRect(x+8,y+18,4,4);
			if(room.west) c.fillRect(x-2,y+8,4,4);
			if(room.east) c.fillRect(x+18,y+8,4,4);
		}
		
		// Draw the spawn points
		c.fillStyle = 'rgb(255,0,255)';
		for(var j=0;j<map.spawnPoints.length;j++){
			var spawnPoint = map.spawnPoints[j];
			x = start_x+spawnPoint.x * 20;
			y = start_y+spawnPoint.y * 20;

			c.fillRect(x+2,y+2,16,16);
		}

		// draw the root
		c.fillStyle = 'rgb(0,255,255)';
		var root = map.root;
		x = start_x+root.x * 20;
		y = start_y+root.y * 20;
		c.fillRect(x+2,y+2,16,16);
		

	};

};
