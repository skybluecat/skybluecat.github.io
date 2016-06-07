document.addEventListener('cifLoaded', function (e) {
	selectedChar = 'eve';
	
	loadDefaultRules();
	
	//Init CiF
	var loadResult = cif.init();
	
	//Load in our schema, cast, triggerRules and volitionRules, and actions.
	rawSchema = cif.loadFile("newdata/data/schema.json");
	schema = cif.loadSocialStructure(rawSchema);


	// CAST
	rawCast = cif.loadFile("newdata/data/cast.json");
	cast = cif.addCharacters(rawCast);

	rawTriggerRules = cif.loadFile("newdata/data/triggerRules.json");
	triggerRules = cif.addRules(rawTriggerRules);

	rawVolitionRules = cif.loadFile("newdata/data/volitionRules.json");
	volitionRules = cif.addRules(rawVolitionRules);

	// Load all actions
	rawActions = cif.loadFile("newdata/data/actions.json");
	actions = cif.addActions(rawActions);

	/*characterActions = cif.loadFile("data/actions/characterActions.json");
	var actions = cif.addActions(characterActions);

	characterReactions = cif.loadFile("data/actions/characterReactions.json");
	var actions = cif.addActions(characterReactions);*/

	rawHistory = cif.loadFile("newdata/data/history.json");
	history = cif.addHistory(rawHistory);

	// STORED VOLITIONS
	storedVolitions = cif.calculateVolition(cast);

    /*$("#characterSelect :input").change(function() {
        selectedChar = this.id;
		if(cast.indexOf(selectedChar)!= -1){graphUpdate();}
		else{console.log("The selected character is already out of the game!")}
        
    });
	*/
	$("#graph-console div").click(function () {
				$("#graph-console div").removeClass("selected");
				 $(this).addClass("selected");
				 selectedChar=this.id;
				 if(cast.indexOf(selectedChar)!= -1){graphUpdate();}
				else{console.log("The selected character is already out of the game!")}
			}).filter(":first").click();
	
	
	
}, false);