










var templogs="";

function printLog()
{
	var s="";
	for(var i in arguments){s+=JSON.stringify(arguments[i])+", ";}
	console.log(s);templogs+=s+"\n";
}
function copyObj(obj)
{
	return JSON.parse(JSON.stringify(obj));
}
function getNextTail(objs,symbols)
{
	//get the next item to add to the head, first considering priority, then in a left-to-right order. ?? is that the best order?
	var best=undefined;var bestPriority=undefined;
	for(var i=0;i<objs.length;i++)
	{
		if(!objs[i])continue;
		if(symbols[i].isHead)continue;
		if(symbols[i].dontMerge)continue;
		if("priority" in symbols[i])
		{
			if(bestPriority===undefined){best=i;bestPriority=symbols[i].priority;continue;}
			if(symbols[i].priority>bestPriority){best=i;bestPriority=symbols[i].priority;continue;}
		}
		else
		{
			if(bestPriority===undefined)
			{
				if(best===undefined){best=i;continue;}
			}
		}
	}
	return best;
}
function mergeByRule(room,tuple,lhs,rhs)
{
	//calls merge to turn the tuple's semantics into one semantic object, and wrap it up with a syntactic object
	//returns an object with the cost, or undefined if it fails
	
	var headIndex=rhs.symbols.findIndex(function(s){if(s.isHead){return true;}return false;});if(headIndex<0){console.log("error: no head item found for rule of "+lhs+": "+JSON.stringify(rhs));}
	var remaining=copyObj(tuple);var nextTail=getNextTail(remaining,rhs.symbols);
	while(nextTail!==undefined)
	{
		var result=merge(room,remaining[headIndex],remaining[nextTail],rhs.symbols[nextTail].hint);
		if(!result){return false;}//result has a semantic object and a cost (sum of component costs and merge cost), but no syntactic object
		remaining[headIndex]=result;
		delete remaining[nextTail];
	}
	if(!remaining[headIndex].cost)remaining[headIndex].cost=0;
	if(rhs.cost)remaining[headIndex].cost+=rhs.cost;
	remaining[headIndex].g={type:lhs};
	if(rhs.tags){remaining[headIndex].g.tags=copyObj(rhs.tags)}//?? todo: what are the tags of the result?
	remaining[headIndex].components=tuple.map(function(o){return o.id;});//record the components' id in the parsed object list
	remaining[headIndex].start=tuple[0].start;remaining[headIndex].end=tuple[tuple.length-1].end;
	return remaining[headIndex];
}



function isExpectedType(room,expected,actual)
{
	var types=room.model.type;
	if((actual!=expected)&&((!types[actual].super_type)||(types[actual].super_type.indexOf(expected)==-1)))
	{
		return false;
	}
	return true;
}


function merge(room,headObj, tailObj, hint)//Combines objects in a possible syntactical combination. Takes optional hints about the tail's relation to the head, like subject,object and recipient; some might call it a "case"
{
	//returns false if failed, or an object with the new semantics and a cost or weirdness score for use later.
	var head=headObj.m;var tail=tailObj.m;//take the semantic (meaning) part
	//var copy=copyObj(head);//should try to reuse some parts of the objects?
	//the rules are: if the tail is a boolean, always attach to the head as a condition(can't check if the predicate is in scope anyway); if the tail is something else: if the head is that the head might take as a property, see if there's a hint and get 
	
	//note: a property does not take "arguments"?
	//first check if the head takes the tail as a non-boolean argument(with or without hint; there may be )
	
	//first try to follow role hints
	if(hint)
	{
		//give priority to property taking owners or values
		if(head.expr)//an expression involving a property
		{
			switch(hint)
			{
				case "subject":
				case "actor":
					//the owner; these should be strictly single valued
					if(head.expr.owner){printLog("property already has an owner",head);return false;}
					head.expr.owner=tail;headObj.cost+=tailObj.cost;return headObj;
					break;
				case "object":
				case "recipient":
				case "topic":
				case "quality":
					if(head.expr.value){printLog("property already has a value",head);return false;}
					head.expr.value=tail;headObj.cost+=tailObj.cost;return headObj;
					break;
				default:
					printLog("Merge error: unknown hint for a property",hint);return false;
			}
		}
		//then try to attach as property of a type; example: "Alice's color" when you only have a property that produces color; or for action verbs
		//note: "person" is the type description, but "a person" is a person description; usually what we get here is not a type description, and we take the type of the description, not the value as a type.
		if((head.type)&&(head.type!="*"))//"*" (usually for vague pronouns) doesn't work like this, but the obstacle is syntactic not semantic("red it" is ungrammatical). or should "*" be allowed, as in "the red thingie"?
		{
			//treat it as a type taking properties
			var hinted=room.model.type[head.type].property.filter(function(p){return (room.model.property[p].role)&&(room.model.property[p].role[hint]);});//??
			if(hinted.length!=1){printLog("Merge error: no unique hinted property for hint and head",hint,head);return false;}
			//cast the tail into a property description with tail as the value
			var propertyName=hinted[0];var expected=room.model.property[propertyName].expected_type;var types=room.model.type;
			if(!isExpectedType(room,expected,tail.type))
			{printLog("Merge info: cannot cast the value to the property; expected type ",expected,"actual tail",tail);return false;}
			var temp={type:"boolean",expr:{predicate:propertyName,value:tail}};
			if(!head.constraint){head.constraint=[];}head.constraint.push(temp);
			return {result:temp,cost:headObj.cost+tailObj.cost};
		}
		
		else{printLog("Merge error: this head cannot take hints",head);return false;}
	}
	
	//if no hint is provided:
	
	//if the tail is a boolean-valued description(either a boolean-valued property access without a target value, or a property with a target value to check against), attach it as a constraint only if that property can describe the head's type, ie head's type have that property; "a childless table" would be rejected (or do we want to keep it anyway? probably with penalty?) 
	//if the boolean comes from other sources - a property that can't possibly apply to the head like "a game-is-running person", or a bare value like "a true number", also reject it
	if(tail.type=="boolean")
	{
		if(tail.value){printLog("merge error: attempt to merge a bare truth value as a condition",head, tail);return false;}
		if(!tail.expr.predicate){printLog("merge error: attempt to merge a predicate-less tail as a condition",head, tail);return false;}
		if(room.model.type[head.type].property.indexOf(tail.expr.predicate)==-1){printLog("merge error: attempt to merge a tail predicate that cannot describe the head",head, tail);return false;}
		
		if(!head.constraint){head.constraint=[];}head.constraint.push(tail);
		return {result:temp,cost:headObj.cost+tailObj.cost};
	}
	
	//if no hint exists and the tail is not boolean, and if the head is a type that takes properties(disregarding whether it's a property access), attach it as a constraint on the value of an property of that type (and complain, guess or give up as appropriate, if there are none or multiple such properties). In this case the scope of the tail must be the head itself and not higher up. (the case of property accesses, like "age of Alice", is taken care of in the hinted case above; this case is for phrases like "red carpet" where it's not made explicit what property is being used, unlike "red-surface-colored carpet")
	else
	{
		var allowed=room.model.type[head.type].property.filter(function(p){return (room.model.property[p].expected_type==tail.type);});
		if(allowed.length==0){printLog("merge error: attempt to merge a tail value that the head cannot take",head, tail);return false;}
		if(allowed.length>1){printLog("merge error: attempt to merge a tail value that the head can take in multiple ways",head, tail);return false;}
		var temp={type:"boolean",expr:{predicate:allowed[0],value:tail}};//no need to check type again
		if(!head.constraint){head.constraint=[];} head.constraint.push(temp);
		return {result:temp,cost:headObj.cost+tailObj.cost};
	}
	
	//todo: if no hint exists and the tail is not boolean, and if the head is a type that does not take properties(like a number) - I'm not entirely sure what to do; it can become a list if both are of the same basic type (like "1,2"), and probably should be rejected as nonsense otherwise
}
	


function createPropertyDescription(worldObj,obj,propertyID)
{
	//todo: check types&kinds and wrap the object as a property to be attached
}




function tokenize(room,input)
{
	for(var g in room.glossary)
	{
		//get all appearances of the word(variations of form are already in the glossary) and insert the objects
		var str=input;var currentIndex=str.indexOf(g);var offset=0;
		while(currentIndex>=0)
		{
			var tempObj=copyObj(room.glossary[g]);
			tempObj.start=currentIndex+offset;tempObj.end=currentIndex+offset+g.length-1;
			tempObj.cost=0;
			room.parseQueue.add(tempObj);
			offset+=currentIndex+1;
			str=str.substring(currentIndex+1);
			currentIndex=str.indexOf(g);
			room.tokensCreated++;
		}
		//todo: push items with a penalty if some words don't have spaces around, are misspelt or have the wrong capitalization
	}
}

function syntacticMatch(obj,symbol)
{
	if(obj.g.type!=symbol.type) return false;
	//todo: match subtypes and tags
	return true;
}

function getLeftTuples(room,end,symbols,index)
{
	//todo: a recursive call, args are last possible end position, the whole RHS, and the last index of the part to get in the RHS
	//should get all possible matching ones but now
	
	//1. get the closest, right next to the end or has some space?
	//2.recursively get the others
	//combine 1 and 2 in all possible ways
	
	printLog("get left tuples: ",end,symbols,index);
	if(index<0){return [[]];}
	if(end<0)return [];
	var current=room.parseTable[end].end;if((end>0)&&(current.length==0))current=current.concat(room.parseTable[end-1].end);//only skip if there's nothing in that space
	var matched=current.filter(function(o){return syntacticMatch(o,symbols[index]); } );
	if(matched.length==0)return [];
	var result=[];
	for(var i=0;i<matched.length;i++)
	{
		var others=getLeftTuples(room,matched[i].start-1,symbols,index-1);
		for(var j=0;j<others.length;j++)
		{
			result.push(others[j].concat([matched[i]]));
		}
	}
	return result;
}
function getRightTuples(room,start,symbols,index)
{
	printLog("get right tuples: ",start,symbols,index);
	if(index>=symbols.length){return [[]];}
	if(start>=room.parseTable.length)return [];
	var current=room.parseTable[start].start;if((start<room.parseTable.length)&&(current.length==0))current=current.concat(room.parseTable[start+1].start);//only skip if there's nothing in that space
	var matched=current.filter(function(o){return syntacticMatch(o,symbols[index]); } );
	if(matched.length==0)return [];
	var result=[];
	for(var i=0;i<matched.length;i++)
	{
		var others=getRightTuples(room,matched[i].end+1,symbols,index+1);
		for(var j=0;j<others.length;j++)
		{
			result.push(others[j].concat([matched[i]]));
		}
	}
	return result;
}

function parse(room,str)
{
	//debug
	printLog("parsing: ",str);
	room.tokensCreated=0;room.nodesCreated=0;room.mergeAttempts=0;
	//var room=rooms[playerObj.room];
	room.parseQueue= new buckets.PriorityQueue(function(a,b){if(a.cost>b.cost)return -1; if(a.cost<b.cost) return 1; if((a.end-a.start)> (b.end-b.start))return 1; if((a.end-a.start)<(b.end-b.start))return -1; return 0;});//prioritize cost but also consider length

	room.parseTable=[];//an array as long as the input, where each entry is an array of parsed objects whose corresponding text starts or ends at that position(inclusive)
	for(var i=0;i<str.length;i++)
	{
		room.parseTable.push({start:[],end:[]});
	}
	
	tokenize(room,str);
	//todo: a better tokenizer; now just a test dummy version with hard coded objects, not even vocabulary management
	
	//debug low-level format: actually just use JSON.parse? too tedious
	
	room.goodParses=[];bestCost=100000;var tolerance=0;//??
	printLog("first item: ",room.parseQueue.peek());
	while((!(room.parseQueue.isEmpty()))&&(room.parseQueue.peek().cost<=bestCost+tolerance))//todo: first get what seems to be the best parse, and then get all parses within a tolerance range that's not much worse than it; if multiple such parses exist we should treat it as a reasonble ambiguity
	{	
		
		room.nodesCreated++;
		var c=room.parseQueue.dequeue();
		printLog("created: ",c);
		room.parseTable[c.start].start.push(c);room.parseTable[c.end].end.push(c);
		//add c to the table - only after it came off the queue!
		if((c.start==0)&&(c.length==str.length))//todo: trim the string first? The idea is the parse should contain all meaningful parts of the string; we are not required to accomodate trailing garbage because it's in a chat setting
		{
			printLog("a good candidate found: ",c);
			if(c.cost<bestCost){bestCost=c.cost;}
			room.goodParses.push(c);
		}
		else
		{
			for(pos in room.grammar)
			{
				for(var j=0;j<room.grammar[pos].length;j++)
				{
					var rule=room.grammar[pos][j];//rule:{cost:...,symbols:[{type:"...",tags:...optional, isHead: optional, priority: optional},{...}]}
					
					for(var index=0;index<rule.symbols.length;index++)
					{
						if(syntacticMatch(c,rule.symbols[index]))
						{
							var leftTuples=getLeftTuples(room,c.start-1,rule.symbols,index-1);//a recursive call, args are last possible end position, the whole RHS, and the last index of the part to get in the RHS
							var rightTuples=getRightTuples(room,c.end+1,rule.symbols,index+1);//likewise
							//the bottom case: when there's no match, return []; when there's no left/right side needed, possibly at the start, is for the tuple array to be [[]], so we don't have to write separate code to check for whether one side is needed
							
							for(var left=0;left<leftTuples.length;left++)
							{
								for(var right=0;right<rightTuples.length;right++)
								{
									room.mergeAttempts++;
									var tempConstituent=mergeByRule(room,leftTuples[left].concat([c]).concat(rightTuples[right]),pos,rule);//merges a whole tuple by the directions and order specified by the grammar.
									if(tempConstituent){room.parseQueue.add(tempConstituent);}
								}
							}
						}
						//if the new object doesn't match that symbol in the rule, do nothing
					}
					//end of a rule
				}
				//end of checking against rules for that POS
			}
			//end of checking against grammar
		}
		//end of processing the first item in the queue
	}	
	//queue is empty or the next item is already significantly more costly than the best parse
	printLog("parsing ended, next item: ",c);
	room.logs=templogs;
	return room.goodParses;
}


