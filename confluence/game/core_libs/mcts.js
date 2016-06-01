/* Takes an instance of a Board and optionally some keyword
 arguments.  Initializes the list of game states and the
 statistics tables.
 */



function MonteCarlo(board, state, turnsTaken, options) {
    this.board = board;
    this.states = deepClone(state);
    this.wins = {'eve': {}};
    this.plays = {'eve': {}};
    this.max_depth = 0;
    this.stats = {};
    this.calculation_time = 60 * 1000;
    this.currentPlayer = 'eve';
    this.max_moves = 15 - turnsTaken;
    this.C = 1.4;
    this.winning_games = [];
}

function _update(state) {
    this.states = [state];
};

function _display() {
    console.log(this.stats)
};

function _winner_message(msg) {
    console.log(msg);
};

function _get_play() {

    this.max_depth = 0;
    this.stats = {};

    // SFDB array for current timestep
    var state = this.states;

    // could change this to get current player from board
    var player = this.currentPlayer;
    var legal = this.board.legal_moves(this.states);

    if (legal.length === 0) {
        return;
    } else if (legal.length === 1) {
        return legal[0];
    }

    var games = 0;
    var begin = new Date().getTime();

    // can add time limit here:
    while (new Date().getTime() - begin < this.calculation_time) {
        console.log("running simulation for game: " + games);
        this.run_simulation();
        games += 1;
    }

    // Display the number of calls to 'run_simulation' and
    // time elapsed
    this.stats['games'] = games;
    this.stats['max_depth'] = this.max_depth;
    this.stats['time'] = new Date().getTime() - begin;

    console.log("Games: " + games + " Time: " + this.stats['time']);
    console.log("Max Depth Searched " + this.stats['max_depth']);

    var move_states = this.board.next_states_from_moves(legal, state);

    var sortedStats = [];

    for (var m = 0; m < move_states.length; m++) {
        var currMove = move_states[m];
        var nextStateHash = getHashFromState(currMove.SFDB);
        sortedStats.push(
            {
                'move': currMove.name,
                'initiator': currMove.initiator,
                'responder': currMove.responder,
                'percent': this.wins[currMove.initiator][nextStateHash] / this.plays[currMove.initiator][nextStateHash],
                'wins': this.wins[currMove.initiator][nextStateHash],
                'plays': this.plays[currMove.initiator][nextStateHash]
            }
        );
    }

    //sortedStats = _.sortBy(sortedStats, 'percent').reverse();

    var best_move = sortedStats[0];
    for(var i = 0; i < sortedStats.length; i++){
        if(sortedStats[i].percent > best_move.percent){
            best_move = sortedStats[i];
        }
    }

    console.log("stats:");
    sortedStats = _.sortBy(sortedStats, function(x){ return -x.percent; });
    console.log(sortedStats);
    this.stats['moves'] = sortedStats;

    // pick the move with the highest percentage of wins.
    return best_move;

};

function _run_simulation() {
    var currPlayerPlays = this.plays[this.currentPlayer];

    var currPlayerWins = this.wins[this.currentPlayer];

    var visited_states = {'eve': {}};

    // clone a copy of this.states, which has the history of SFDB
    var states_copy = deepClone(this.states);
    var state = states_copy;

    var recordOfMoves = [];
    var player = this.currentPlayer;

    var expand = true;
    var winner = null;

    for (var t = 0; t < this.max_moves; t++) {

        var legal = this.board.legal_moves(state);
        var move_states = this.board.next_states_from_moves(legal, state);

        // check to see if have all stats for available moves
        // if have all stats, don't need to run simulation
        var haveAllStats = true;
        var sumMoveStatePlays = 0;
        for (var s = 0; s < move_states.length; s++) {
            var savedMoveState = currPlayerPlays[getHashFromState(move_states[s].SFDB)];
            if (savedMoveState === undefined) {
                haveAllStats = false;
                break;
            }else{
                sumMoveStatePlays += savedMoveState;
            }
        }

        var move_info = {};
        if (haveAllStats) {

            var log_total = Math.log(sumMoveStatePlays);

            var stats = [];
            for (var m = 0; m < move_states.length; m++) {
                var currMove = move_states[m];
                var nextStateHash = getHashFromState(currMove.SFDB);
                var val = (currPlayerWins[nextStateHash] / currPlayerPlays[nextStateHash]) +
                    this.C * Math.sqrt(log_total / currPlayerPlays[nextStateHash]);
                stats.push(
                    {
                        'value': val,
                        'state': currMove.SFDB,
                        'move': currMove.name,
                        'initiator': currMove.initiator,
                        'responder': currMove.responder
                    }
                );
            }
            move_info = stats[0];

            for(var x = 1; x < stats.length; x++){
                var currStat = stats[x];
                if(currStat['value'] > move_info['value']){
                    move_info = currStat;
                }
            }


        } else {
            var move = _.sample(move_states);

            move_info = {
                'state': move.SFDB,
                'move': move.name,
                'initiator': move.initiator,
                'responder': move.responder
            };

        }

        // possessed player left so no moves because moves have condition that player is present
        if(move_states.length === 0){
            winner = null;
            console.log("no moves available with state: ");
            console.log(state);
            break;
        }

        // add move to states_copy
        state = move_info['state'];
        recordOfMoves.push(move_info['move'] + " to " + move_info['responder']);

        var stateHash = getHashFromState(move_info['state']);
        if (expand && currPlayerPlays[stateHash] === undefined) {
            expand = false;
            currPlayerPlays[stateHash] = 0;
            currPlayerWins[stateHash] = 0;
            if (t > this.max_depth) {
                this.max_depth = t;
            }
        }

        visited_states[this.currentPlayer][stateHash] = true;

        // player = this.board.current_player(state)
        winner = this.board.winner(move_info['state']);
        if (winner !== null) {
            console.log("WINNING MOVES: ");
            console.log(recordOfMoves);
            this.winning_games.push(recordOfMoves);
            break;
        }

    }

    var playerVisitedStates = visited_states[this.currentPlayer];
    for (var i in playerVisitedStates) {
        if (playerVisitedStates.hasOwnProperty(i)) {
            if (currPlayerPlays[i] === undefined) {
                continue;
            }

            currPlayerPlays[i] += 1;
            if (this.currentPlayer === winner) {
                currPlayerWins[i] += 1;
            }
        }
    }
};

/* Takes a game state, and appends it to the history. */
MonteCarlo.prototype.update = _update;

MonteCarlo.prototype.display = _display;

MonteCarlo.prototype.winner_message = _winner_message;

/* Causes the AI to calculate the best move from the
 current game state and return it. */
MonteCarlo.prototype.get_play = _get_play;

MonteCarlo.prototype.run_simulation = _run_simulation;

function _getHashFromState(sfdbToHash) {

    return objectHash.MD5(sfdbToHash);
};

var getHashFromState = _getHashFromState;

// global variable
MonteCarloFactory = MonteCarlo;

var event = document.createEvent('Event');
event.initEvent('monteCarloLoaded', true, true);
document.dispatchEvent(event);

