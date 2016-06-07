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
    layoutUpdate();
}, 20);
function layoutUpdate(tab)
{
	d3.select("#tabs-content").style("top",d3.select("#tabs-navigation").property("clientHeight")+"px");
	if ("onresize" in tab){tab.onresize();}
	
	
}

function layoutGraph()
{
	var myscale=d3.scale.linear().domain([0,20,50,80,100]).range(["darkred","red","yellow","green","darkgreen"]);
	var mylegend=d3.legend.color().shapeWidth(d3.select("#tabs-navigation").property("clientWidth")/21-2).orient('horizontal').scale(myscale).cells(21);
	var svg = d3.select("#graph-canvas").selectAll(".scale");svg.selectAll("g").remove();
	svg.append("g")
	  .attr("class", "legendLinear");
	svg.select(".legendLinear").call(mylegend);
}
function layoutLog()
{
	d3.select("#updates-old").style("top",window.getComputedStyle(document.getElementById("updates")).getPropertyValue("height"));
}


graphUpdate = function () {
	;
	
    $("#characters-content").empty();//keep the character selection
   /* $("#characters-content").append('<div class="row">' +
        '<div class="col-md-2 darkred">0-19</div>' +
        '<div class="col-md-4 red">20-49</div>' +
        '<div class="col-md-4 green">50-79</div>' +
        ' <div class="col-md-2 darkgreen">80-100</div>' +
        '</div>');
*/

    //loadCharacterTree(cif, selectedChar, "#characters-content");
	//now using bars to display stats
	loadCharacterStats(cif,selectedChar,"#characters-content");

    /*$("#characters").append('<div class="row">' +
        '<div class="col-md-6 darkred">False</div>' +
        '<div class="col-md-6 darkgreen">True</div>' +
        '</div>');*/

    /*$("#attitude").empty();
    $("#attitude").append('<div class="row">' +
        '<div class="col-md-2 darkred">0-19</div>' +
        '<div class="col-md-4 red">20-49</div>' +
        '<div class="col-md-4 green">50-79</div>' +
        ' <div class="col-md-2 darkgreen">80-100</div>' +
        '</div>');
		*/
	$("#graph-canvas").empty();
	/*$("#graph-canvas").append('<div style="width:100%;text-align:center;">' +
        '<div style="width:19%;display:inline-block;background-color:darkred;">0-19</div>' +
        '<div style="width:30%;display:inline-block;background-color:red;">20-49</div>' +
        '<div style="width:30%;display:inline-block;background-color:green;">50-79</div>' +
        ' <div style="width:20%;display:inline-block;background-color:darkgreen;">80-100</div>' +
        '</div>');*/
	var svg = d3.select("#graph-canvas").append("svg").attr("class","scale").style("width","100%").style("height","60px");
	
	  //svg getBBox only works if the thing is displayed (not display:none)! so the scale should only render when the tab is selected
	
	  
    loadDirected(cif, "attitude", "closeness", selectedChar, "#graph-canvas");
    loadDirected(cif, "attitude", "attraction", selectedChar, "#graph-canvas");
    loadDirected(cif, "attitude", "aggression", selectedChar, "#graph-canvas");

    //$("#relationships").empty();
    /*
    $("#relationships").append('<div class="row">' +
        '<div class="col-md-6 darkred">False</div>' +
        '<div class="col-md-6 darkgreen">True</div>' +
        '</div>');
    loadReciprocal(cif, selectedChar, "#relationships");
    */
//now all characters summary are displayed together
    //loadReciprocalAlternative(cif, selectedChar, "#characters-content");


   // $("#inventory").empty();
	//loadInventory(cif, selectedChar, "#characters-content");
	layoutUpdate(selectedTab);
};
var loadCharacterStats=function(EEObject,chosenCharacter,domElement)
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
		loadReciprocalAlternative(cif, curChar, "#"+curChar+"-info div.characterinfocontent");
		loadInventory(cif, curChar, "#"+curChar+"-info div.characterinfocontent");
	}
}
var loadReciprocalAlternative = function (cif, chosenCharacter, domElement) {
    
    var cast = cif.getCharacters();

    // uses global rawSchema variable from initial load of schema
    var loadedSchema = rawSchema;
	var ps=d3.select(domElement);
	var cats=ps.append("p").attr("class","stat-category");
	cats.append("span").attr("class","stat-category-text").text("Relationships");
    for (var catNum = 0; catNum < loadedSchema.schema.length; catNum++) {
        var tempCat = loadedSchema.schema[catNum];

        if (tempCat.directionType === "reciprocal") {

            if (tempCat.isBoolean) {

                //reciprocal boolean value, assuming it's a kind of relationship
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
    types = ['poolcue', 'gun', 'pill'];
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