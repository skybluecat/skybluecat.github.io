recommendMove = function () {
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            w = new Worker("core_libs/next_play.js");
            w.postMessage([cif.getSFDBForD3(), gameVariables.turnNumber]);
        }
        w.onmessage = function(event) {
            $("#moveText").empty();
            //$("#moveText").append("Games Simulated: " + gameAI.stats.games + "<br>");
            $("#moveText").append("move: " + event.data + "<br>");
            /*$("#moveText").append("to: " + move.responder + "<br>");
            $("#moveText").append("% winning: " + (move.percent * 100).toFixed(2) + "<br>");
            $("#moveText").append("simulated plays: " + move.plays + "<br>");
            $("#moveText").append("simulated wins: " + move.wins + "<br>");*/
        }; 

    } else {
        console.log("No WebWorker Support!");
    }
};

showWinningGame = function () {
    var winningGames = gameAI.winning_games;
    if (winningGames.length === 0) {
        return;
    }
    var shortestGame = winningGames[0];

    for (var i = 1; i < winningGames.length; i++) {
        if (winningGames[i].length < shortestGame.length) {
            shortestGame = winningGames[i];
        }
    }
    $("#winningGame").empty();
    $("#winningGame").append("<br>");
    $("#winningGame").append("<h3>Shortest Path To Victory</h3>");
    for(var g = 0; g < shortestGame.length; g++){
        $("#winningGame").append(shortestGame[g] + "<br>");
    }

};