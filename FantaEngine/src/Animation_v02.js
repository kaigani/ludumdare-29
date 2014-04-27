//
// Animation & Timeline classes
//


var Timeline = function(graph,vertexList){

	this.graph = graph;
	this.vertexList = vertexList || {}; // id : [{time,x,y}, ... ] frames
};

// findFrame(id) will add that id to vertexList
Timeline.prototype.findFrames = function(id){

	var frames = this.vertexList[id];

	if(!frames){
		frames = [];
		this.vertexList[id] = frames;
	}

	return frames;

};

// Keyframe the current graph at the set time
// Overwrite existing time if exists
Timeline.prototype.keyframe = function(time){

	for(var i=0;i<this.graph.vertices.length;i++){

		var vertex = this.graph.vertices[i];
		vertex.updateWorldTransform();

		var p = { time:time, x:vertex.worldX, y:vertex.worldY };

		var frames = this.findFrames(vertex.id);

		var found = false;
		for(var j=0;!found && j<frames.length;j++){
			var frame = frames[j];

			if(frame.time > time){
				frames.splice(j,0,p);
				found = true;
			}else if(frame.time == time){
				frames.splice(j,1,p);
				found = true;
			}
		}

		if(!found){
			frames.push(p);
		}
	}

	// This is redundant now - TODO - REMOVE
	/*
	function frameSort(frames){

		frames.sort(function(a,b){
			return a.time - b.time;
		});
	}
	*/
};

// ANIMATION ROUTINES -- do they belong here? need to change to allow mix

// Apply - update graph according to timeline
// TODO - implement looping ***
Timeline.prototype.apply = function(time,loop){

	for(var i=0;i<this.graph.vertices.length;i++){

		var vertex = this.graph.vertices[i];
		var frames = this.findFrames(vertex.id);
		var frame = null;
		var j=0;

		var totalDuration = this.totalDuration();

		if(loop){
			time = time%totalDuration;
	
			if(time < 0){
				time = totalDuration + time;
			}
		}

		for(j=0;j<frames.length;j++){

			frame = frames[j];
			//console.log(frame);
			if(frame.time > time) break;
		}

		if(frame !== null){

			var frameBefore = frames[j-1] || frames[0];
			var t=time;
			if(t > frame.time) t = frame.time;
			if(t < frameBefore.time) t = frameBefore.time;

			var duration = frame.time - frameBefore.time;
			var elapsed = t - frameBefore.time;
			var remaining = frame.time - t;

			//console.log("Duration, Elapsed, Remaining: ",duration,elapsed,remaining);

			if(duration !== 0){
				var x0 = (remaining/duration)*frameBefore.x;
				var y0 = (remaining/duration)*frameBefore.y;
				var x1 = (elapsed/duration)*frame.x;
				var y1 = (elapsed/duration)*frame.y;

				//console.log("[",x0,y0,"] [",x1,y1,"]");

				var p1 = vertex.bone.worldToLocalCoord({x:x0+x1,y:y0+y1});

				vertex.x = p1.x;
				vertex.y = p1.y;
			}else{

				var p2 = vertex.bone.worldToLocalCoord(frame);
				vertex.x = p2.x;
				vertex.y = p2.y;
			}
		}
	}

	this.graph.updateData();
};

// Total duration - all timelines start from 0

Timeline.prototype.totalDuration = function(){

	var time = 0;

	for(var id in this.vertexList){

		var frames = this.vertexList[id];
		var last_i = frames.length-1;

		time = (time > frames[last_i].time) ? time : frames[last_i].time;
	}

	return time;
};


// EXPORT
Timeline.prototype.getData = function(){

	var o = {};
	o[this.graph.name] = this.vertexList;

	return o;
};

//
// ANIMATION CLASS - wrapper for timelines
// - allows for multiple graphs to be tied to an animation name such as 'walking'
// - timelines referenced by graph names 

var Animation = function(name){

	this.name = name || "Unnamed Animation";
	this.timelines = {};
};

Animation.prototype.addTimeline = function(timeline){
	this.timelines[timeline.graph.name] = timeline;
};

Animation.prototype.removeTimeline = function(timeline){

	// TODO
};

Animation.prototype.findTimeline = function(graphName){

	return this.timelines[graphName];
};

Animation.prototype.getData = function(){

	var o = {};
	o.name = this.name;
	o.graphs = {};

	var graphs = o.graphs;

	for(var graphName in this.timelines){
		var timeline = this.timelines[graphName];
		var timelineData = timeline.getData();

		graphs[graphName] = timelineData[graphName]; // a little weird to conform with SplineJS style
	}
	
	return o;
};

// Needs an array of graphs to build timelines against
// overwrite - true = overwrite name
Animation.prototype.map = function(graphList,data,overwrite){

	this.name = overwrite ? data.name : this.name;
	this.timelines = {};

	for(var i=0;i<graphList.length;i++){

		var graph = graphList[i];
		this.timelines[graph.name] = new Timeline(graph,data.graphs[graph.name]);
	}
};













