inScreenActions = [];
initiator = "";
responder = "";

Coordinator = function (s) {
    var sVolitions = cif.calculateVolition(cast);
    console.log(sVolitions);
    var pActions = cif.getActions("player", "player", sVolitions, cast, 5, 5);


    console.log("message from unity to:" + s);
    console.log(pActions);


    // setup next turn
    nextTurn();
    updateLocalStateInformation();
    displayStateInformation();
};

applyAction = function (selectedAction) {
    // Select an action from the ones in screen to execute
    console.log("Applying action: " + selectedAction);
    console.log(inScreenActions[selectedAction]);

    //build string to pass to graphUpdate();
    var updateArr = [];
    var effects = inScreenActions[selectedAction].effects;
    for (var i = 0; i < effects.length; i += 1) {

        cif.set(effects[i]);
        var e = effects[i];
        if (e.class === "mood") {
            updateArr.push(e.first + ": " + e.operator + e.value + " " + e.type);
        } else if (e.class === "relationship") {
            var tmpStr = e.first + " and " + e.second;
            tmpStr += e.value ? " are " : " are not ";
            tmpStr += " " + pluralizeType(e.type);
            updateArr.push(tmpStr);
        }else if (e.class === "attitude") {
            var tmpStrRel = e.first + ": " + e.operator + e.value + " " + e.type + " to " + e.second;
            updateArr.push(tmpStrRel);
        }
    }

    var triggerArr = cif.runTriggerRules(cast);


    graphUpdate();
    updateBox(updateArr, triggerArr);
    nextTurn();

    //mctsUpdate();

    // Log results
    logMetric("actions", selectedAction + "," + e.first + "," + e.second);
};

updateBox = function (strArr, triggerArr) {
    str = "<p>";
    for (var i = 0; i < strArr.length; i++) {
        splitArr = strArr[i].split(" ");
        str += strArr[i];
        if (splitArr[splitArr.length - 1] === "enemies" || splitArr[splitArr.length - 1] === "friends") {
            str += '<img src="' + "images/" + splitArr[splitArr.length - 1] + '.png"  style="width:50px;height:50px; data-toggle="tooltip" data-placement="left" title="' + '"">';
        } else if(splitArr[splitArr.length - 3] === "closeness" || splitArr[splitArr.length - 3] === "attraction" || splitArr[splitArr.length - 3] === "aggression"){
            str += '<img src="' + "images/" + splitArr[splitArr.length - 3] + '.png"  style="width:25px;height:25px; data-toggle="tooltip" data-placement="left" title="' + '"">';

        }else {
            str += '<img src="' + "images/" + splitArr[splitArr.length - 1] + '.png"  style="width:25px;height:25px; data-toggle="tooltip" data-placement="left" title="' + '"">';

        }
        str += '<br>';
    }

    for (var i = 0; i < triggerArr.explanations.length; i++) {
        var tmpStr = triggerArr.explanations[i];
        var beginIndex = tmpStr.indexOf(":");
        tmpStr = tmpStr.substring(beginIndex + 1);
        tmpStr = tmpStr.replace(/\d\)/, "");
        tmpStr = tmpStr.replace(/\d\)/g, ", ");
        tmpStr = tmpStr.replace("is not present", "left");
        str += tmpStr;
        str += '<br>';
    }
    str += '</p>';
	var update=$('#updates');
	$('#updates-old').append(update.html());
    update.empty();
    update.append(str);
	d3.select("#updates-old").style("top",d3.select("#updates").property("clientHeight")+"px");
};

pluralizeType = function (str) {
    if (str === "friend") {
        return "friends";
    } else if (str === "enemy") {
        return "enemies";
    }
};

nextTurn = function () {
    gameVariables.turnNumber++;
    console.log("Moving to turn " + gameVariables.turnNumber);

    // Check if the initiator or responder has left
    if (cif.get({"class": "status", "type": "present", "first": initiator}).length == 0) {
        toUnity("EnsembleEngine", "characterLeaves", initiator);
        logMetric("character_leaves", initiator);
    }
    if (cif.get({"class": "status", "type": "present", "first": responder}).length == 0) {
        toUnity("EnsembleEngine", "characterLeaves", responder);
        logMetric("character_leaves", responder);
    }

    if (gameVariables.gameOver === true) {
        var endMessageArea = document.getElementById("statusMessage");
        endMessageArea.innerHTML = gameVariables.endingText;
    }
    else {
        storedVolitions = cif.calculateVolition(cast);
        cif.setupNextTimeStep();
    }
};

cleanActionsFromUI = function () {
    toUnity("EnsembleEngine", "cleanActionsFromUI", "");
}

getAvailableCharacterActions = function (initiatorTag, responderTag) {
    // Catch if storedVolitions is null or undefined at this point
    if (storedVolitions == undefined || storedVolitions == null) {
        // Reload the page
        alert("There was an error in loading the game engine, the page will reload");
        location.reload();
    }

    // Get the actions that the player wants to do
    inScreenActions = cif.getActions(initiatorTag, responderTag, storedVolitions, cast, 10, 10);

    var desired = "";
    for (var i in inScreenActions) {
        // Index this actions by their name instead of number
        inScreenActions[inScreenActions[i].name] = inScreenActions[i];

        desired += inScreenActions[i].displayName + ":" + inScreenActions[i].name + "-";
    }

    desired = desired.substring(0, desired.length - 1);

    // Save the initiator and responder for when applying actions
    initiator = initiatorTag;
    responder = responderTag;

    console.log("Received tags: " + initiatorTag + " - " + responderTag);
    toUnity("EnsembleEngine", "displayAvailableCharacterActions", desired + "=" + responderTag);
};

log = function (id, field, value) {
    $.ajax({
        method: "post",
        url: "Log.php",
        data: {
            id: id,
            field: field,
            value: value
        },
        success: function (data) {
            console.log(data);
        },
        error: function () {
            console.log("ERROR LOGGING!!!!");
        }
    });
};

addItemToCharacterInventory = function (character, itemName) {


    console.log("character: " + character + " item: " + itemName);
    updatedInfo = {
        class: "inventory",
        type: itemName,
        first: character,
        value: true
    }
    cif.set(updatedInfo);
    graphUpdate();
};


mctsUpdate = function () {
    console.log("Begin running mcts get_play()...");
    console.log(gameAI);
    var move = gameAI.get_play();
    console.log("After running mcts get_play()");
    console.log(move);
};


deepClone = function (e) {
    if (null === e || "object" != typeof e) return e;
    if (e instanceof Array) {
        var t = [];
        for (var n = 0, r = e.length; n < r; n++) t[n] = deepClone(e[n]);
        return t
    }
    if (e instanceof Object) {
        var t = {};
        for (var i in e) e.hasOwnProperty(i) && (t[i] = deepClone(e[i]));
        return t
    }
    throw new Error("Unable to copy obj! Its type isn't supported.")
};
