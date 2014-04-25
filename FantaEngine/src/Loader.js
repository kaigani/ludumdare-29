//
// Loader.js - handles data loading, import/export JSON
//

var Loader = function(){

	var loader = this;

	this.loadDataUrl = function(url,callback){

		// defined in Utilities.js
		getJSON(url,function(json){

			var data = loader.importJSON(json);

			callback(data);
		});
	};

	this.exportData = function(graphList,animationList){

		var data = {};
		data.graphs = {};
		data.animations = {};

		var i,o;

		for(i=0;i<graphList.length;i++){

			var graphData = graphList[i].getData();

			o = {};
			o.vertices = graphData.vertices;
			o.shapes = graphData.shapes;

			data.graphs[graphData.name] = o;
		}

		for(i=0;i<animationList.length;i++){

			var animationData = animationList[i].getData();

			o = {};
			o.graphs = animationData.graphs;

			data.animations[animationData.name] = o;
		}

		return data;
	};

	this.exportJSON = function(graphList,animationList){

		return JSON.stringify(this.exportData(graphList,animationList));
	};

	this.importData = function(data){

		var wrapper = {};
		wrapper.graphList = [];
		wrapper.animationList = [];

		for(var graphName in data.graphs){

			var graph = new Graph(graphName);
			graph.map(data.graphs[graphName]);

			wrapper.graphList.push(graph);
		}

		for(var animationName in data.animations){

			var animation = new Animation(animationName);
			animation.map(wrapper.graphList,data.animations[animationName]);

			wrapper.animationList.push(animation);
		}

		return wrapper;
	};

	this.importJSON = function(json){

		return this.importData(JSON.parse(json));
	};
};