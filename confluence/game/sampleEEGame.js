
var stateInformation = {
	 "sbroToPlayerFriendliness" : "NA",
	 "tbroToPlayerFriendliness" : "NA",
	 "playerStrength" : "NA"
};

var gameVariables = {
	"gameOver" : false,
	"endingText" : "NA",
	"turnNumber" : 0,
	"numIntents" : 5,
	"numActionsPerIntent" : 5
};


//Fills the actionList div with buttons corresponding to the actions the player can take.
var populateActionList = function(initiator, responder, storedVolitions, cast){
	var char1 = initiator;
	var char2 = responder;
	
	//Num intents to look at: 5
	//Num actions per intent: 2 (for now!)
	//console.log("storedVolitions before getting possible actions... " , storedVolitions.dump());
	var possibleActions = cif.getActions(char1, char2, storedVolitions, cast, gameVariables.numIntents, gameVariables.numActionsPerIntent);
	//console.log("Possible Actions From " + char1 + " to " + char2 + ": ", possibleActions);

	var divName = "actionList_" + char1 + "_" + char2;
	var actionList = document.getElementById(divName);

	//Let's make a button for each action the hero wants to take!
	for(var i = 0; i < possibleActions.length; i += 1){
		//Make a new button
		var action = possibleActions[i];

		//If the character doesn't have a strong volition to do this action,
		//don't include it in the action list.
		if(action.weight < 0){
			continue;
		}
		var buttonnode= document.createElement('input');
		buttonnode.setAttribute('type','button');
		buttonnode.setAttribute('name',action);
		buttonnode.setAttribute('value',action.displayName);
		buttonnode.actionToPerform = action;
		buttonnode.cast = cast;
		buttonnode.onclick = actionButtonClicked;
		//buttonnode.attachEvent('onclick', actionButtonClicked2);


		actionList.appendChild(buttonnode);
	}

	//Write a little message if there were no possible actions.
	if(actionList.innerHTML === ""){
		actionList.innerHTML = "<i>No Actions Available</i>";
	}

};

var actionButtonClicked = function(){
	//Clean away all of the other actions -- they made their choice!
	clearActionList();

	//Play some SICK ANIMATION (like a text bubble flashing!)
	playInstantiationAnimation();

	//CHANGE THE SOCIAL STATE -- social physics baby!!!
	var effects = this.actionToPerform.effects; // should be an array of effects.
	for(var i = 0; i < effects.length; i += 1){
		cif.set(effects[i]);
	}

	//RUN SOME TRIGGER RULES based on the new state!
	cif.runTriggerRules(this.cast);

	//Print out if the action was 'accepted' or rejected!
	var statusArea = document.getElementById("statusMessage");
	var acceptMessage = this.actionToPerform.displayName + " successful!";
	if(this.actionToPerform.isAccept !== undefined && this.actionToPerform.isAccept === false){
		acceptMessage = this.actionToPerform.displayName + " failed!";
	}
	statusArea.innerHTML = acceptMessage;

	//Re-draw the people (maybe even by having them MOVE to their new positions...)
	//Also re-draw any debug/state informaton we want.
	updateLocalStateInformation();
	displayStateInformation();


	//set up next turn.
	nextTurn();
};