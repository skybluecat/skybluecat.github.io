
mctsInit = function(){
    gameAI = new MonteCarloFactory(new BoardFactory(), [cif.getSFDBForD3()], gameVariables.turnNumber);
};

