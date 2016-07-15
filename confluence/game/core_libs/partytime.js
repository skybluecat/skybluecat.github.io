var stateInformation = {
    //"playerAlive" : true
    //now doesn't make sense
};

var gameVariables = {
    "gameOver": false,
    "endingText": "NA",
    "turnNumber": 0,
    "numIntents": 3,
    "numActionsPerIntent": 5
};
function throttle (func, wait) {
    var throttling = false;
    return function(){
        if ( !throttling ){
            func.apply(this, arguments);
            throttling = true;
            setTimeout(function(){
                throttling = false;
            }, wait);            
        }
    };
}
window.onresize = throttle(function() {
    layoutUpdate(selectedTab);
}, 20);
function layoutUpdate(tab)
{
	d3.select("#tabs-content").style("top",d3.select("#tabs-navigation").property("clientHeight")+"px");
	if ((tab)&&(tab.onresize)){tab.onresize();}
	
	
}
var myscale=d3.scale.linear().domain([0,20,50,80,100]).range(["darkred","red","yellow","green","darkgreen"]);
var mylegend=d3.legend.color();


var relationTypeColors={"closeness":"lightgreen","attraction":"pink","aggression":"tomato","married":"deeppink","friend":"limegreen","sibling":"turquoise","enemy":"darkred"};

function getLinkColor(d) 
{
	/*if(d.isBoolean)
	{return myscale(100*d.value);}
	else{return myscale(100*(d.value-d.minValue)/(d.maxValue-d.minValue));}*/
	return relationTypeColors[d.type];
}
function layoutGraph()
{
	/*mylegend.shapeWidth(d3.select("#tabs-navigation").property("clientWidth")/21-2).orient('horizontal').scale(myscale).cells(21);
	var svg = d3.select("#graph-canvas").selectAll(".scale");svg.selectAll("g").remove();
	svg.append("g")
	  .attr("class", "legendLinear");
	svg.select(".legendLinear").call(mylegend);*/
	
	//now not using a color scale, since multiple types need colors
	//TODO: add schema-based color/threshold controls for each kind of relation
	//using a fixed color legend for types of relations
	var scaleSelection = d3.select("#graph-canvas").selectAll(".scale");scaleSelection.selectAll("g").remove();
	var ordinal = d3.scale.ordinal()
	  .domain(Object.keys(relationTypeColors))
	  .range(Object.keys(relationTypeColors).map(function(a){return relationTypeColors[a]}));
	scaleSelection.append("g")
	  .attr("class", "legendOrdinal")
	  .attr("transform", "translate(40,20)");
	var legendOrdinal = d3.legend.color()
	  //d3 symbol creates a path-string, for example
	  //"M0,-8.059274488676564L9.306048591020996,
	  //8.059274488676564 -9.306048591020996,8.059274488676564Z"
	  .shape("path", d3.svg.symbol().type("square").size(200)())
	  .shapePadding(70)
	  .scale(ordinal)
	  .orient('horizontal');
	scaleSelection.select(".legendOrdinal")
	  .call(legendOrdinal);
	
	var lineSize = d3.scale.linear().domain([0,100]).range([1, 5]);
	scaleSelection.append("g")
	  .attr("class", "legendSizeLine")
	  .attr("transform", "translate(0, 60)");
	var legendSizeLine = d3.legend.size()
		  .scale(lineSize)
		  .shape("line")
		  .orient("horizontal")
		  .labels(["very low or no", "low", "medium", "high", "very high or yes"])
		  .shapeWidth(40)
		  .labelAlign("start")
		  .shapePadding(70);

	scaleSelection.select(".legendSizeLine")
	  .call(legendSizeLine);
	
}
function layoutLog()
{
	d3.select("#updates-old").style("top",window.getComputedStyle(document.getElementById("updates")).getPropertyValue("height"));
}
var nodes = {};var links=[];var forceLayout;var graphSelection;var scaleSelection;var nodeSelection; var linkSelection;
var lastValues={};
function graphInit(){
	// initializes the social graph only - now we don't redraw the graph completely every time, but the character view is still completely remade every turn, so it's in graphUpdate
	//creates the color scale svg but doesn't draw the color scale because it must only be drawn when the tab is visible due to the way d3.legend is made, so I draw it on layout updates, ie when user clicks the graph tab
	scaleSelection = d3.select("#graph-canvas").append("svg").attr("class","scale").style("width","100%").style("height","90px");
	
	//
	//initialize saved social state values
	for (var catNum = 0; catNum < rawSchema.schema.length; catNum++) 
	{
        var tempCat = rawSchema.schema[catNum];
        if (tempCat.directionType == "directed") 
		{
            for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) 
			{
                var tempType = tempCat.types[typeNum];lastValues[tempType]={};
                for(var c1 = 0; c1 < cast.length; c1++)
				{lastValues[tempType][cast[c1]]={};
					for (var c2=0;c2<cast.length;c2++)
					{
						if (c2==c1)continue;
						var query = {"class": tempCat.class,"type": tempType,"first": cast[c1],"second" : cast[c2]};
						var results = cif.get(query);
						var val = false;//booleans which are false return no results
						if ((results.length > 0) && typeof(results[0].value) !== "undefined") {val = results[0].value;}
						lastValues[tempType][cast[c1]][cast[c2]]= val;
					} 
                }
            }
        }
		if (tempCat.directionType == "reciprocal") 
		{
            for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) 
			{
                var tempType = tempCat.types[typeNum];lastValues[tempType]={};
                for(var c1 = 0; c1 < cast.length; c1++)
				{lastValues[tempType][cast[c1]]={};
					for (var c2=c1+1;c2<cast.length;c2++)//reciprocal so only one side needed
					{
						var query = {"class": tempCat.class,"type": tempType,"first": cast[c1],"second" : cast[c2]};
						var results = cif.get(query);
						var val = false;//booleans which are false return no results
						if ((results.length > 0) && typeof(results[0].value) !== "undefined") {val = results[0].value;}
						lastValues[tempType][cast[c1]][cast[c2]]= val;
					}
                }
            }
        }
	}
	//TODO: make a force graph layout
	//update nodes with cast at updates
	
    forceLayout = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([500, 500])//TODO: adjust size based on interface layout
        .linkDistance(200).linkStrength(function(d){if(d.isBoolean)return 1; else return d.value/d.maxValue;})
        .charge(-200)
        .on("tick", tick);

    graphSelection = d3.select("#graph-canvas").append("svg").attr("id","graph-svg").style("width","100%").style("height","500px").call(tip);
    linkSelection = graphSelection.selectAll(".link");      
    nodeSelection = graphSelection.selectAll(".node");
    // Use elliptical arc path segments to doubly-encode directionality.
    
}
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(textDescription);
function tick() {
	linkSelection.attr("d", linkArc);
	nodeSelection.attr("transform", transform);
	//nodeSelection.selectAll("text").attr("transform", transform);
}
var count=0;
function linkArc(d) {
	var dx = d.target.x - d.source.x,
	dy = d.target.y - d.source.y;
	//dr = (Math.sqrt(dx*dx+dy*dy)/2)*(Math.sqrt(dx*dx+dy*dy)/2)/(d.linknum*15);//r=(distance/2)^2/offset
	//return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
	//if(count<10){console.log(d);count++;}
	//not using arcs, use line segments
	
	var dv=new Victor(dx,dy);
	var nv=dv.clone().normalize();
	var ov=dv.clone().rotate(Math.PI/2).normalize();//a unit offset vector to the right; note rotate and rotateBy are different, the latter seems wrong
	var ov2=ov.clone().multiply(new Victor((d.linknum-0.5)*10,(d.linknum-0.5)*10));//total offset, minus half a unit so two innermost lines in the middle will be one unit apart instead of two
	if(d.reciprocal)
	{return "M" + (d.source.x+ov2.x) + "," + (d.source.y+ov2.y) + " l " + dv.x+","+dv.y;}//no arrows
	else
	{return "M" + (d.source.x+ov2.x) + "," + (d.source.y+ov2.y) + " l " + dv.x/2+","+dv.y/2 +" l "+((ov.x-nv.x)*7) + "," + ((ov.y-nv.y)*7) + " m "+(-ov.x*14) + "," + (-ov.y*14) +" l "+((ov.x+nv.x)*7) + "," + ((ov.y+nv.y)*7)  + " l "+ (dv.x/2) + "," + (dv.y/2);}
}
//TODO: add arrows for directionality
function transform(d) {
	return "translate(" + d.x + "," + d.y + ")";
}
function graphUpdate() {
//actually updates both the character statistics view and the graph display
	
    $("#characters-content").empty();//TODO: add a character filter/navigation control when we need many characters
	loadCharacterStats(cif,selectedChar,"#characters-content");

	getRelationshipLinks();
	renderRelationshipGraph();
	layoutUpdate(selectedTab);
};

function getRelationshipLinks()
{
		var cast = cif.getCharacters();
		for(var c in nodes){if (cast.indexOf(c)==-1){delete nodes[c];}}//update character nodes
		for(var i=0;i<cast.length;i++){if(!nodes[cast[i]]){nodes[cast[i]]={id:cast[i],name:getCharacterName(cast[i])};}}
	links.length=0;
	//TODO: instead of querying everything, try getting the data directly from the database somehow
    for (var catNum = 0; catNum < rawSchema.schema.length; catNum++) 
	{
        var tempCat = rawSchema.schema[catNum];
        if (tempCat.directionType == "directed") 
		{
            for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) 
			{
                var tempType = tempCat.types[typeNum];
                for(var c1 = 0; c1 < cast.length; c1++)
				{
					for (var c2=0;c2<cast.length;c2++)
					{
						if (c2==c1)continue;
						var query = {"class": tempCat.class,"type": tempType,"first": cast[c1],"second" : cast[c2]};
						var results = cif.get(query);
						var val = false;//booleans which are false return no results
						if ((results.length > 0) && typeof(results[0].value) !== "undefined") {val = results[0].value;}
						var updated = lastValues[tempType][cast[c1]][cast[c2]]!== val;
						//TODO: save values for all types?
						var tempobj={"source" : nodes[cast[c1]],"target" : nodes[cast[c2]], "value" : val,"updated": updated,"reciprocal":false,type:tempType,isBoolean:tempCat.isBoolean};
						if(tempCat.isBoolean){tempobj.defaultValue=tempCat.defaultValue;}
						else{tempobj.defaultValue=tempCat.defaultValue;tempobj.minValue=tempCat.minValue;tempobj.maxValue=tempCat.maxValue;}//save value range for future display styles
						if((updated)||((tempCat.isBoolean==true)&&(val!=tempCat.defaultValue))||(val>tempCat.defaultValue))links.push(tempobj);
						lastValues[tempType][cast[c1]][cast[c2]]= val;
					}
                    
                }
            }
        }
		if (tempCat.directionType == "reciprocal") 
		{
            for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) 
			{
                var tempType = tempCat.types[typeNum];
                for(var c1 = 0; c1 < cast.length; c1++)
				{
					for (var c2=c1+1;c2<cast.length;c2++)//reciprocal so only one side needed
					{
						var query = {"class": tempCat.class,"type": tempType,"first": cast[c1],"second" : cast[c2]};
						var results = cif.get(query);
						var val = false;//booleans which are false return no results
						if ((results.length > 0) && typeof(results[0].value) !== "undefined") {val = results[0].value;}
						var updated = lastValues[tempType][cast[c1]][cast[c2]]!== val;
						//TODO: save values for all types?
						var tempobj={"source" : nodes[cast[c1]],"target" : nodes[cast[c2]], "value" : val,"updated": updated,"reciprocal":true,type:tempType,isBoolean:tempCat.isBoolean};
						if(tempCat.isBoolean){tempobj.defaultValue=tempCat.defaultValue;}
						else{tempobj.defaultValue=tempCat.defaultValue;tempobj.minValue=tempCat.minValue;tempobj.maxValue=tempCat.maxValue;}//save value range for future display styles
						if((updated)||((tempCat.isBoolean==true)&&(val!=tempCat.defaultValue))||(val>tempCat.defaultValue))links.push(tempobj);
						lastValues[tempType][cast[c1]][cast[c2]]= val;
					}
                }
            }
        }
    }
}



function renderRelationshipGraph()
{
	//copied code for multi-digraph

	//sort links by source, then target; id is internal character name
	links.sort(function(a,b) {
		if (a.source.id > b.source.id) {return 1;}
		else if (a.source.id < b.source.id) {return -1;}
		else {
			if (a.target.id > b.target.id) {return 1;}
			if (a.target.id < b.target.id) {return -1;}
			else {return 0;}
		}
	});
	//any links with duplicate source and target get an incremented 'linknum', starting from 1
	for (var i=0; i<links.length; i++) {
		if (i != 0 &&
			links[i].source == links[i-1].source &&
			links[i].target == links[i-1].target) {
				links[i].linknum = links[i-1].linknum + 1;
			}
		else {links[i].linknum = 1;};
	};

	

	var w = 500,
		h = 500;
	forceLayout.stop();
	forceLayout.nodes(d3.values(nodes))
		.links(links)
		.size([w, h]);
	//
	linkSelection=linkSelection.data(forceLayout.links(),function(d){return d.source.id+d.target.id+d.type;});
	linkSelection.exit().remove();
	linkSelection.enter().insert("path",".node")//drawn before all nodes
		.attr("class","link")
		.attr("fill","transparent")
		.attr("stroke",function(d){return relationTypeColors[d.type];})
		.attr("stroke-width", function (d) {
			if(d.isBoolean){return 5;}
			return Math.log(Math.max(d.value,1));
		})
		.on('mouseover', tip.show).on('mouseout', tip.hide);
	linkSelection = graphSelection.selectAll(".link");//the whole selection needs to update shapes at every tick
	
	
	
	nodeSelection=nodeSelection.data(forceLayout.nodes(),function(d){return d.id;});
	nodeSelection.exit().remove();
	var newNodes=nodeSelection.enter().append("g").attr("class","node").call(forceLayout.drag);
	newNodes.append("image")
		.attr("xlink:href", function(d){return "./img/"+d.id+".png"})
		.attr("x", -16)
		.attr("y", -16)
		.attr("width", 32)
		.attr("height", 32);
	newNodes.append("text")
		.attr("x", 8)
		.attr("y", ".31em")
		.text(function (d) {
			return d.name;
		});
	nodeSelection = graphSelection.selectAll(".node");
	forceLayout.start();
}

function textDescription(d)
{
	return d.type+" "+d.value;
}


//relationship graph stuff above
function loadCharacterStats(EEObject,chosenCharacter,domElement)
{
	var loadedSchema = rawSchema;
	var ps=d3.select(domElement);//parent selection
	for (var cindex = 0; cindex < cast.length; cindex++) 
	{
		var curChar=cast[cindex];
		var cs=ps.append("div").attr("id",curChar+"-info");
		cs.append("div").attr("class","characterinfohead").text(curChar).append("img").attr("src","img/"+curChar+".png").attr("class","charactericon");
		var charContents=cs.append("div").attr("class","characterinfocontent");
		var numericContents=charContents.append("div").attr("class","numericcontent");
		var booleanContents=charContents.append("div").attr("class","booleancontent");
		for (var catNum = 0; catNum < loadedSchema.schema.length; catNum++) 
		{
			var tempCat = loadedSchema.schema[catNum];
			if(tempCat.class === "inventory" || tempCat.class.indexOf("SFDBLabel")>=0){//TODO: display SFDB Labels elegantly
				continue;
			}
			if (tempCat.directionType === "undirected") 
			{
				
				if (tempCat.isBoolean === false) {
					//undirected number value
					var cats=numericContents.append("p").attr("class","stat-category");
					cats.append("span").attr("class","stat-category-text").text(tempCat.class);
					for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) {
						var tempType = tempCat.types[typeNum];
						var query = {
							"class": tempCat.class,
							"type": tempType,
							"first": curChar
						};
						var results = EEObject.get(query);
						if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
							var ss=cats.append("span").attr("class","stat-numeric");
							var tempText=tempType.length>8?tempType.substring(0,6)+"...":tempType;
							ss.append("span").attr("class","stat-numeric-text").text(tempText+": "+results[0].value);
							ss.append("span").attr("class","stat-numeric-container").append("span").style("width",results[0].value+"px").style("display","block").style("height","1em").style("background-color","lightgreen");
						}
					}
				}
				else {
					//undirected boolean value
					var cats=booleanContents.append("p").attr("class","stat-category");
					cats.append("span").attr("class","stat-category-text").text(tempCat.class);
					for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) {
						var tempType = tempCat.types[typeNum];
						query = {
							"class": tempCat.class,
							"type": tempType,
							"first": curChar,
							"value": true
						};
						var results = EEObject.get(query);
						if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
							cats.append("span").text(results[0].type).attr("class","stat-boolean");
						}
						// don't show traits if false because traits are permanent and won't change during game
					}
				}
			}
		}
		
		loadInventory(cif, curChar, "#"+curChar+"-info div.characterinfocontent");
		loadBooleanRelationships(cif, curChar, "#"+curChar+"-info div.characterinfocontent");
	}
}
var loadBooleanRelationships = function (cif, chosenCharacter, domElement) {
    
    var cast = cif.getCharacters();
    var loadedSchema = rawSchema;
	var ps=d3.select(domElement);
	var cats=ps.append("p").attr("class","stat-category");
	cats.append("span").attr("class","stat-category-text").text("Relationships");
    for (var catNum = 0; catNum < loadedSchema.schema.length; catNum++) {
        var tempCat = loadedSchema.schema[catNum];
	if ((tempCat.directionType === "reciprocal")||(tempCat.directionType === "directed")) {//directed booleans are also included
            if (tempCat.isBoolean) {
                //binary boolean value, assuming it's a kind of relationship
                for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) {
                    var chars = [];
                    var tempType = tempCat.types[typeNum];

                    for (var c = 0; c < cast.length; c++) {
                        if (cast[c] === chosenCharacter) {
                            continue;
                        }
                        var other = cast[c];
                        query = {
                            "class": tempCat.class,
                            "type": tempType,
                            "first": chosenCharacter,
                            "second": other,
                            "value": true
                        };
                        var results = cif.get(query);
                        var val = false;
                        if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
                            val = true;
                        }
                        if(val){
                            chars.push(other);
                        }
                    }
					if(chars.length === 0){
                        continue;//skip empty relationships to save space
						//ss.append("span").text("none");
                    }
                    var ss=cats.append("span").attr("class","stat-relationship").text(tempType+": ");
                    //$(domElement).append('</h3>');
                    for(var e = 0; e < chars.length; e++){
                        ss.append("img").attr("src","img/" + chars[e] + ".png").attr("class","charactericon").text(chars[e]);
                    }
                }
            }
        }
    }


}

var loadInventory = function (cif, selectedChar, domElement) {
    types = Object.keys(schema.inventory);//['poolcue', 'gun', 'pill'];
    var inventoryEmpty = true;
	var ps=d3.select(domElement);
	var cats=ps.append("p").attr("class","stat-category");
	cats.append("span").attr("class","stat-category-text").text("Inventory");
    for (var i = 0; i < types.length; i++) {
        query = {
            "class": "inventory",
            "type": types[i],
            "first": selectedChar,
            "value": true
        };
        var results = cif.get(query);
		
        if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
            cats.append("span").attr("class","stat-inventory").text(types[i]).append("img").attr("src",types[i] + ".png").attr("class","charactericon");
            inventoryEmpty = false;
        }
    }
    if (inventoryEmpty) {
        cats.append("span").attr("class","stat-inventory").text("no items");

    }
};

var setupCharacterDescriptions = function () {
    var mydiv;
    for (var i = 0; i < cast.length; i++) {
        mydiv = document.getElementById(cast[i]);
        mydiv.innerHTML = getCharacterName(cast[i]) + getCharacterDescription(cast[i]);
    }
};


var setUpInitialState = function () {
    //update our local copies of these variables, and display them.
    updateLocalStateInformation();
};

//Fills in all of the actionList divs with buttons corresponding to the actions the player can take
//by calling individual instances of populateActionList
var populateActionLists = function (storedVolitions, cast) {
    for (var i = 0; i < cast.length; i++) {
        populateActionList(playerChar, cast[i], storedVolitions, cast);
    }
};

//Fills the actionList div with buttons corresponding to the actions the player can take.
var populateActionList = function (initiator, responder, storedVolitions, cast) {
    var char1 = initiator;
    var char2 = responder;

    //Num intents to look at: 5
    //Num actions per intent: 2 (for now!)
    //console.log("storedVolitions before getting possible actions... " , storedVolitions.dump());
    var possibleActions = cif.getActions(char1, char2, storedVolitions, cast, gameVariables.numIntents, gameVariables.numActionsPerIntent);


    var mydiv = document.getElementById(char2);

    var tempp;
    mydiv.innerHTML += "<br/>Actions to " + char2 + ": ";
    //Let's make a button for each action the hero wants to take!
    for (var i = 0; i < possibleActions.length; i += 1) {
        //Make a new button
        var action = possibleActions[i];

        //If the character doesn't have a strong volition to do this action,
        //don't include it in the action list.
        //if(action.weight < -10){
        //	continue;
        //}
        var buttonnode = document.createElement('input');
        buttonnode.setAttribute('type', 'button');
        buttonnode.setAttribute('name', action);
        buttonnode.setAttribute('value', action.displayName + "(" + action.weight + ")");
        buttonnode.actionToPerform = action;
        buttonnode.cast = cast;
        buttonnode.onclick = actionButtonClicked;
        //buttonnode.attachEvent('onclick', actionButtonClicked2);


        mydiv.appendChild(buttonnode);
    }

    //Write a little message if there were no possible actions.
    if (possibleActions.length == 0) {

        mydiv.innerHTML += "No actions possible";
    }

};

var actionButtonClicked = function () {
    //Clean away all of the other actions -- they made their choice!
    clearActionList();


    //CHANGE THE SOCIAL STATE -- social physics baby!!!
    var effects = this.actionToPerform.effects; // should be an array of effects.
    for (var i = 0; i < effects.length; i += 1) {
        cif.set(effects[i]);
    }
//do not run trigger rules here, because then it would be run multiple times per turn

    //Print out if the action was 'accepted' or rejected!
    var statusArea = document.getElementById("actionsMessage");
    var acceptMessage = this.actionToPerform.displayName + " successful! ";
    if (this.actionToPerform.isAccept !== undefined && this.actionToPerform.isAccept === false) {
        acceptMessage = this.actionToPerform.displayName + " failed! ";
    }
    statusArea.innerHTML = acceptMessage;

    /////////////////////
    //other characters get to act now!
    /////////////////////
    storedVolitions = cif.calculateVolition(cast);
    var NPCActions = new Array();
    var tempAction;
    var i;
    var j;
    for (i = 0; i < cast.length; i += 1) {
        if (cast[i] == playerChar) {
            continue;
        }
        for (j = 0; j < cast.length; j += 1) {
            NPCActions = NPCActions.concat(cif.getActions(cast[i], cast[j], storedVolitions, cast, 3, 3));
        }
        console.log("This is what " + cast[i] + " wants to do:");
        console.log(NPCActions);
        NPCActions = NPCActions.filter(function (a) {
            return (a.weight >= 0)
        });
        if (NPCActions.length == 0) {
            console.log("nonono! this guy has no actions! it's the rule writer's fault!");
            continue;
        }
        tempAction = NPCActions[Math.floor(Math.random() * NPCActions.length)];
        effects = tempAction.effects; // should be an array of effects.
        for (j = 0; j < effects.length; j += 1) {
            cif.set(effects[j]);
        }
        statusArea.innerHTML += "  "
        acceptMessage = tempAction.displayName + " (by " + tempAction.goodBindings[0].initiator + " to " + tempAction.goodBindings[0].responder + ") successful!";
        if (tempAction.isAccept !== undefined && tempAction.isAccept === false) {
            acceptMessage = tempAction.displayName + " (by " + tempAction.goodBindings[0].initiator + " to " + tempAction.goodBindings[0].responder + ") failed!";
        }
        statusArea.innerHTML += acceptMessage;
        NPCActions = new Array();
    }
    //RUN SOME TRIGGER RULES based on the new state!
    cif.runTriggerRules(cast);
    //check for characters leaving and eliminate them in Ensemble
    var query;
    var results;
    for (var k = 0; k < cast.length; k += 1) {
        query = {
            "class": "status",
            "type": "present",
            "first": cast[k],
            "value": true
        };
        results = cif.get(query);
        if (results.length == 0) {
            cif.setCharacterEliminated(cast[k]);
            var tempdiv = document.getElementById(cast[k]);
            manor.removeChild(tempdiv);
            statusArea.innerHTML += "<b>Good job! " + getCharacterName(cast[k]) + " left the party!</b> ";
            cast[k] = undefined;
        }
    }
    cast = cast.filter(function (a) {
        if ((typeof a) == "undefined")return false; else return true;
    });

    updateLocalStateInformation();
    //set up next turn.
    var event = document.createEvent('Event');
    event.initEvent('nextTurn', true, true);
    document.dispatchEvent(event);
};

var clearActionList = function () {
    for (var i = 0; i < cast.length; i++) {
        document.getElementById(cast[i]).innerHTML = "";
    }
};

//Checks to see if the game is over!
var checkForEndConditions = function () {
    /*if(stateInformation.playerAlive == false){
     //uh oh, we lose!
     gameVariables.gameOver = true;
     gameVariables.endingText = "Game Over! You are dead!";
     }
     */

    if (gameVariables.turnNumber >= 20) {
        //took too long!
        gameVariables.gameOver = true;
        gameVariables.endingText = "Time's up! You did not make everybody leave fast enough. You feel sorry for your ancient ghostly self :(";
    }
    if (cast.length == 0) {
        gameVariables.gameOver = true;
        gameVariables.endingText = "Congratulations! Your manipulations successfully ended the party and probably left many hearts broken. How sweet for a ghost!";
        var manorDescription = document.getElementById("manorDescription");
        manorDescription.innerHTML = "Haunted house, dignified and empty."
    }

};

//There are certain things that we might need to 'refresh' again (the visibility of the action list,
//the state of dialogue bubbles, etc.)
var cleanUpUIForNewTurn = function () {
};

var updateLocalStateInformation = function () {
//now the player can't be killed because he's a ghost
    /*	var playerAlivePred = {
     "class" : "trait",
     "type" : "alive",
     "first" : "player",
     "value" : true,
     };

     var results;
     results=cif.get(playerAlivePred);
     if(results.length>0){stateInformation.playerAlive = true;}
     else{stateInformation.playerAlive=false;}
     */

};

var getCharacterDescription = function (character) {
    var desc = "";
    var results;
    var query;
    var cats;
    var types;//categories and types in the schema
    var tempcat;
    var temptype;
    for (cats = 0; cats < rawSchema.schema.length; cats++) {
        tempcat = rawSchema.schema[cats];
        if (tempcat.directionType == "undirected") {
            if (tempcat.isBoolean == false) {
                //undirected number value
                for (types = 0; types < tempcat.types.length; types++) {
                    temptype = tempcat.types[types];
                    query = {
                        "class": tempcat.class,
                        "type": temptype,
                        "first": character
                    };
                    results = cif.get(query);
                    if ((results.length > 0) && typeof(results[0].value) != "undefined") {
                        desc += ", " + temptype + ": " + results[0].value.toString();
                    }
                }
            }
            else {
                //undirected boolean value
                for (types = 0; types < tempcat.types.length; types++) {
                    temptype = tempcat.types[types];
                    query = {
                        "class": tempcat.class,
                        "type": temptype,
                        "first": character,
                        "value": true
                    };
                    results = cif.get(query);
                    if ((results.length > 0) && typeof(results[0].value) != "undefined") {
                        desc += ", " + temptype;
                    }
                    else {
                        desc += ", not " + temptype;
                    }
                }
            }
        }
    }
    return desc;
}
var getCharacterName = function (charid) {
    if (typeof rawCast.cast[charid].name == "undefined") {
        console.log(charid + " is not a valid cast member!");
        return "No such character " + charid;
    }
    else {
        return rawCast.cast[charid].name;
    }
}