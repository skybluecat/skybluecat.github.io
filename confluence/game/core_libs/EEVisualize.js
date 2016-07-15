

var directedLastVal = {
    'closeness': {},
    'attraction': {},
    'aggression': {}
};

var scale100=d3.scale.linear().domain([0,20,50,80,100]).range(["darkred","red","yellow","green","darkgreen"]);

function getColorFromType(type)
{
	return relationTypeColors[type];
}
function getColorFromNum(num, max, updated) {
	return scale100(num);//moving update style elsewhere
    /*
	var index = Math.floor((num / max) * 10);
    var redToGreen = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "nine"];
    var redToGreenDash = ["zero-dash", "one-dash", "two-dash", "three-dash", "four-dash", "five-dash", "six-dash", "seven-dash", "eight-dash", "nine-dash", "nine-dash"];

    if(updated){
        return redToGreenDash[index];
    }else{
        return redToGreen[index];
    }
	*/
}

function getColorFromBool(value){
	if(value)return scale100(100);else return scale100(0);
	/*
    if(value){
        return "nine";
    }else{
        return "zero";
    }
	*/
}