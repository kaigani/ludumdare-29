//
// Event manager
//


// TODO - should allow priority events to stop others? for now will handle externally by removing
(function(window){

	window.EventManager = function EventManager(){

	var listeners = {}; // { event_name : [ listener_methods ..]}}
	var parents = {}; // { parent_object : [ listener_methods ...]}

	var eventQueue = [];
	var eventDispatched = null;

	// listeners should be tagged to the scene as parent 
	this.on = function(event,listener,parent){

		var parentClass = parent ? parent.constructor.name : null;

		console.log("\tAdd event listener",parentClass,":",event);

		if(typeof listeners[event] === 'undefined') listeners[event] = [];

		if(listeners[event].indexOf(listener) === -1){
			listeners[event].push(listener);
		}

		if(parentClass){
			if(typeof parents[parentClass] === 'undefined') parents[parentClass] = [];
			parents[parentClass].push(listener);
		}else{
			console.warn("Adding event listener without a parent:",event);
		}
	};

	this.remove = function(event,listener){

		console.log("\tAttempt to remove event listener for event:",event);

		if(typeof listeners[event] !== 'undefined'){

			var i = listeners[event].indexOf(listener);

			if(i !== -1){
				console.log("\t\tREMOVED",event);
				listeners[event].splice(i,1);
			}
		}
	};

	// remove the listener across all events
	this.removeListener = function(listener){

		console.log("\t* Removing all listeners by function");

		for(var event in listeners){
			var i = listeners[event].indexOf(listener);
			if(i !== -1){
				this.remove(event,listener);
			}
		}
	};

	// Release all listeners attached to this parent's CLASS (all scenes)
	this.release = function(parent){

		var parentClass = parent ? parent.constructor.name : null;

		console.log("\n* Release >> Parent class: "+parentClass);

		var childListeners = parents[parentClass] || [];

		for(var i=0;i<childListeners.length;i++){

			console.log("\n* Releasing listener ["+(i+1)+"/"+childListeners.length+"] for parent",parent.constructor.name);

			var listener = childListeners[i];
			this.removeListener(listener);
		}

		// Zero out all listeners 
		parents[parentClass] = [];
		
	};

	this.send = function(event,data,sender){

		if(!sender){
			console.warn("Include sender reference when sending events!");
			sender = { constructor : { name : 'NO SENDER REFERENCE'}};
		}

		if(event !== 'Tick'){ 
			console.log("\nSEND EVENT from:",sender.constructor.name," > > > > \t",event);
			console.log("\teventDispatched:",eventDispatched);
		}

		if(typeof listeners[event] !== 'undefined'){

			// we could also have the listener trigger break condition & go from last to first -- TODO
			for(var i=0;i<listeners[event].length;i++){
				var listener = listeners[event][i];
				listener(data);
			}
		}
	};

	// EVENT QUEUE - for events that need time to complete
	// interrupt = true - remove any prior instances of the same event and replace with this one
	// -- for example, MoveTo events don't need to stack, you can interrupt one for the next

	// TODO - should events have linked children - so interrupting one removes its dependencies?

	this.queue = function(event,data,sender,interrupt){

		console.log("\nQUEUE EVENT:",event,data,sender.constructor.name,interrupt);
		console.log("\teventDispatched:",eventDispatched);

		if(interrupt){

			for(var i=0;i<eventQueue.length;i++){

				if(eventQueue[i].event == event){
					eventQueue.splice(i,1);
				}
			}

			if(eventDispatched == event){
				console.warn("Send Override a dispatched event:",eventDispatched);
				this.send(event,data,sender);
			}else{
				eventQueue.push({event:event,data:data,sender:sender});

				if(eventDispatched === null){
					this.dispatchNext();
				}
			}
		}else{

			eventQueue.push({event:event,data:data,sender:sender});

			if(eventDispatched === null){
				this.dispatchNext();
			}
		}
	
	};

	this.dispatchNext = function(){

		console.log("\n> > > Dispatch next");

		if(eventQueue.length > 0){

			var o = eventQueue.shift();

			eventDispatched = o.event;

			// send a event end:Event
			this.send(o.event,o.data,o.sender);
			

			return true;
		}else{
			console.log("Event queue emptied.");
			return false;
		}
	};

	// for debugging
	this.list = function(){
		console.log(listeners,parents);
		console.log("\nEVENT QUEUE\n");
		if(eventDispatched) console.log(eventDispatched,"dispatched");
		console.log(eventQueue.length,"in eventQueue");
		for(var i=0;i<eventQueue.length;i++){

			var o = eventQueue[i];
			console.log("\t",o.event,o.data,o.sender);
		}
	};

	// dequeues events from the most recently pushed onto the queue, or all of them if removeAll = true
	this.dequeue = function(event,removeAll){

		for(var n=eventQueue.length;n>0;n--){
			var i = n-1;

			if(eventQueue[i].event == event){
				eventQueue.splice(i,1);
				if(!removeAll) break;
			}
		}
	};

	// finished most recent event
	this.finished = function(event,finishAll){

		if(typeof event === 'undefined'){
			console.warn("Confirm event name when finishing!");
			event = "UNKNOWN";
		}

		console.log("Finished event,",event);
		if(event !== eventDispatched) console.warn("Event [",event,"], Event Dispatched [",eventDispatched,"] Mismatch * * * * * ");

		if(eventDispatched !== null){
			var prevEvent = eventDispatched;
			eventDispatched = null;
			this.send('end:'+prevEvent,true,this); // this is an event manager message
		}
		
		if(finishAll){
			eventQueue = [];
		}

		this.dispatchNext();
	};

	// clear the queue
	this.clear = function(){
		console.log("Clear the event queue,",eventQueue);
		this.finished("CLEAR",true);
	};

	this.flush = function(){
		console.log("Flushing events");
		for(var i=0;this.dispatchNext();i++){
			console.log("Dispatched:",i);
		}
	};
};

})(window);