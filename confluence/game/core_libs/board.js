function Board(currentSFDB) {

    this.currentPlayer = 'eve';
    this.CIFinstance = cifDuplicate;
    this.CIFinstance.init();

    //Load in our schema, cast, triggerRules and volitionRules, and actions.
    //var rawSchema = cif.loadFile("newdata/data/schema.json");
    this.CIFinstance.loadSocialStructure(rawSchema);

    // CAST
    //var rawCast = cif.loadFile("newdata/data/cast.json");
    this.CIFinstance.addCharacters(rawCast);

    //var rawTriggerRules = cif.loadFile("newdata/data/triggerRules.json");
    this.CIFinstance.addRules(rawTriggerRules);

    //var rawVolitionRules = cif.loadFile("newdata/data/volitionRules.json");
    this.CIFinstance.addRules(rawVolitionRules);

    // Load all actions
    //var rawActions = cif.loadFile("newdata/data/actions.json");
    this.CIFinstance.addActions(rawActions);

    /*characterActions = cif.loadFile("data/actions/characterActions.json");
     var actions = cif.addActions(characterActions);

     characterReactions = cif.loadFile("data/actions/characterReactions.json");
     var actions = cif.addActions(characterReactions);*/

    //var rawHistory = cif.loadFile("newdata/data/history.json");
    //history = cif.addHistory(rawHistory);

    // set the SFDB with a clone of current SFDB instead of loading history

}

Board.prototype.legal_moves = function (SFDB) {
    this.CIFinstance.setSFDB(SFDB);
    var storedVolitions = this.CIFinstance.calculateVolition(cast);
    var actionArr = [];
    for (var i = 0; i < cast.length; i++) {
        var actions = this.CIFinstance.getActions(this.currentPlayer, cast[i], storedVolitions, cast, 10, 10);
        for (var a = 0; a < actions.length; a++) {
            actionArr.push({
                    "initiator": this.currentPlayer,
                    "responder": cast[i],
                    "name": actions[a].name,
                    "effects": actions[a].effects,
                    "action": actions[a]
                }
            );
        }
    }
    return actionArr;
};

Board.prototype.next_states_from_moves = function (moves, SFDB) {
    var next_states = [];

    // iterate through moves array and generate next state for each action
    for (var a = 0; a < moves.length; a++) {
        this.CIFinstance.setSFDB(deepClone(SFDB));
        var effects = moves[a].effects;
        for (var i = 0; i < effects.length; i += 1) {
            this.CIFinstance.set(effects[i]);
        }
        this.CIFinstance.runTriggerRules(cast);

        // can optimize this by not calling setupNextTimeStep, but this will break duration based predicates
        this.CIFinstance.setupNextTimeStep();
        //storedVolitions = cif.calculateVolition(cast);
        //this.CIFinstance.setupNextTimeStep();

        // sort currentSFDB so that hash of same SFDB state will always be same
        var currSFDB = [this.CIFinstance.getSFDBForD3()];

        //currSFDB = _.sortBy(currSFDB, 'class');
        //currSFDB = _.sortBy(currSFDB, 'type');
        //currSFDB = _.sortBy(currSFDB, 'first');
        //currSFDB = _.sortBy(currSFDB, 'second');
        next_states.push({
            // gets most recent timestep of SFDB
            "SFDB": currSFDB,
            "initiator": moves[a].initiator,
            "responder": moves[a].responder,
            "name": moves[a].name
        });
    }
    return next_states;
};

Board.prototype.getCurrentPlayer = function () {
    return this.currentPlayer;
};


Board.prototype.winner = function (state_copy) {
    // var leaveCount = 0;
    //this.CIFinstance.setSFDB(deepClone(state_copy));
    var count = 0;
    var stateArr = state_copy[0];
    for(var i = 0; i < stateArr.length; i++){
        var curr = stateArr[i];
        if(curr.class === "status" && curr.type === "present" && curr.value === false){
            count++;
        }
    }
    if(count >= 4){
        return this.currentPlayer;
    }

    return null;
    /*
    for (var i = 0; i < cast.length; i++) {
        if (cast[i] === this.currentPlayer) {
            continue;
        }
        var query = {
            "class": "status",
            "type": "present",
            "first": cast[i],
            "value": false
        };
        var results = this.CIFinstance.get(query);

        if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
            leaveCount++;
        }
    }
    var result = null;

    if (leaveCount === 1) {
        result = this.currentPlayer;
    }
    return result;
    */
};

BoardFactory = Board;


