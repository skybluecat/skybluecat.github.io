// adapted from Collapsible Tree demo at: http://bl.ocks.org/mbostock/4339083

function loadCharacterTree(EEObject, chosenCharacter, domElement) {
	var parentdiv=d3.select(domElement);
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = parentdiv.property("clientWidth") - margin.right - margin.left,
        height = 400 - margin.top - margin.bottom;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    var svg = parentdiv.append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var root = {
        "name": chosenCharacter,
        "children": [],
        "x0": height / 2,
        "y0": 0
    }


    buildTreeFromSFDB(root);

    function buildTreeFromSFDB(root) {

        var loadedSchema = rawSchema;


        for (var catNum = 0; catNum < loadedSchema.schema.length; catNum++) {

            var tempCat = loadedSchema.schema[catNum];
            if(tempCat.class === "inventory" || tempCat.class === "status" || tempCat.class === "SFDBLabelUndirected"){
                continue;
            }

            if (tempCat.directionType === "undirected") {
                var catNode = {
                    "name" : tempCat.class,
                    "children" : []
                }
                if (tempCat.isBoolean === false) {
                    //undirected number value

                    for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) {
                        var tempType = tempCat.types[typeNum];
                        var query = {
                            "class": tempCat.class,
                            "type": tempType,
                            "first": chosenCharacter
                        };
                        var results = EEObject.get(query);
                        if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
                            catNode.children.push({
                                "name": results[0].type + " (" + results[0].value + ") ",
                                "children" : [],
                                "value" : results[0].value
                            });
                        }
                    }

                }
                else {
                    //undirected boolean value
                    for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) {
                        var tempType = tempCat.types[typeNum];
                        query = {
                            "class": tempCat.class,
                            "type": tempType,
                            "first": chosenCharacter,
                            "value": true
                        };
                        var results = EEObject.get(query);
                        if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
                            catNode.children.push({
                                "name": results[0].type,
                                "children" : [],
                                "value" : results[0].value
                            });
                        }
                        // don't show traits if false because traits are permanent and won't change during game
                        /*else {
                            catNode.children.push({
                                "name": tempType,
                                "children" : [],
                                "value" : false
                            });
                        }
                        */
                    }
                }
                root.children.push(catNode);
            }
        }

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        // commented out so that trees show up in full
        //root.children.forEach(collapse);
        update(root);

    }

    d3.select(self.frameElement).style("height", "200px");

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * 180;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function (d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function (d) {
                if (d.value === undefined) {
                    return d._children ? "lightsteelblue" : "#fff";
                } else {
                    if (d.value === true) {
                        return "green";
                    } else if (d.value === false) {
                        return "red";
                    } else {
                        switch (true) {
                            case (d.value > 79):
                                return "darkgreen";
                            case (d.value > 49):
                                return "green";
                            case (d.value > 19):
                                return "red";
                            default:
                                return "darkred";
                        }

                    }
                }

            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }


}

var directedLastVal = {
    'closeness': {},
    'attraction': {},
    'aggression': {}
};

function initDirectedLastVal(){
    var cast = ['bob', 'ann', 'carlos', 'dre', 'eve'];
    for(var i = 0; i < cast.length; i++){
        directedLastVal['closeness'][cast[i]] = {};
        directedLastVal['attraction'][cast[i]] = {};
        directedLastVal['aggression'][cast[i]] = {};

        for(var j = 0; j < cast.length; j++){
            if(cast[i] === cast[j]){
                continue;
            }
            directedLastVal['closeness'][cast[i]][cast[j]] = -5;
            directedLastVal['attraction'][cast[i]][cast[j]] = -5;
            directedLastVal['aggression'][cast[i]][cast[j]] = -5;
        }
    }
}

initDirectedLastVal();


function loadDirected(EEObject, className, type, chosenCharacter, domElement) {

    var cast = EEObject.getCharacters();

    // uses global rawSchema variable from initial load of schema
    var loadedSchema = rawSchema;

    for (var catNum = 0; catNum < loadedSchema.schema.length; catNum++) {
        var tempCat = loadedSchema.schema[catNum];

        if (tempCat.directionType === "directed") {

            //undirected boolean value
            for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) {

                var tempType = tempCat.types[typeNum];

                if(tempType !== type){
                    continue;
                }

                var links = [];

                for(var c = 0; c < cast.length; c++){
                    if(cast[c] === chosenCharacter){
                        continue;
                    }
                    var other = cast[c];
                    var query = {
                        "class": tempCat.class,
                        "type": tempType,
                        "first": chosenCharacter,
                        "second" : other
                    };
                    var results = EEObject.get(query);
                    var val = 0;
                    if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
                        val = results[0].value;
                    }

                    var updated = directedLastVal[type][chosenCharacter][other] >= 0 && directedLastVal[type][chosenCharacter][other] !== val;

                    links.push({
                        "source" : chosenCharacter,
                        "target" : other,
                        "color" : getColorFromNum(val, 100, updated),
						"updated": updated
                    });

                    directedLastVal[type][chosenCharacter][other] = val;

                    query = {
                        "class": tempCat.class,
                        "type": tempType,
                        "first": other,
                        "second" : chosenCharacter
                    };

                    results = EEObject.get(query);
                    var val = 0;
                    if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
                        val = results[0].value;
                    }

                    updated = directedLastVal[type][other][chosenCharacter] >= 0 && directedLastVal[type][other][chosenCharacter] !== val;

                    links.push({
                        "source" : other,
                        "target" : chosenCharacter,
                        "color" : getColorFromNum(val, 100, updated),
						"updated": updated
                    });

                    directedLastVal[type][other][chosenCharacter] = val;
                }

                loadGraph(links, domElement, tempType);
            }
        }
    }

}

function loadReciprocal(EEObject, chosenCharacter, domElement) {

    var cast = EEObject.getCharacters();

    // uses global rawSchema variable from initial load of schema
    var loadedSchema = rawSchema;

    for (var catNum = 0; catNum < loadedSchema.schema.length; catNum++) {
        var tempCat = loadedSchema.schema[catNum];

        if (tempCat.directionType === "reciprocal") {

            if (tempCat.isBoolean) {

                //undirected boolean value
                for (var typeNum = 0; typeNum < tempCat.types.length; typeNum++) {
                    var links = [];
                    var tempType = tempCat.types[typeNum];

                    for(var c = 0; c < cast.length; c++){
                        if(cast[c] === chosenCharacter){
                            continue;
                        }
                        var other = cast[c];
                        query = {
                            "class": tempCat.class,
                            "type": tempType,
                            "first": chosenCharacter,
                            "second" : other,
                            "value": true
                        };
                        var results = EEObject.get(query);
                        var val = false;
                        if ((results.length > 0) && typeof(results[0].value) !== "undefined") {
                            val = true;
                        }

                        links.push({
                            "source" : chosenCharacter,
                            "target" : other,
                            "type" : getColorFromBool(val)
                        });

                        links.push({
                            "source" : other,
                            "target" : chosenCharacter,
                            "type" : getColorFromBool(val)
                        });

                    }
                    loadGraph(links, domElement, tempType);
                }
            }
        }
    }
}



function loadGraph(links, domElement, type){
    var nodes = {};
    // Compute the distinct nodes from the links.
    links.forEach(function (link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: getCharacterName(link.source)});
        link.target = nodes[link.target] || (nodes[link.target] = {name: getCharacterName(link.target)});
    });

    var width = 200,
        height = 200;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick);
    //.start();

    var svg = d3.select(domElement).append("svg")
        .attr("width", width)
        .attr("height", height);

    // Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
        .data(["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine","zero-dash", "one-dash", "two-dash", "three-dash", "four-dash", "five-dash", "six-dash", "seven-dash", "eight-dash", "nine-dash", "nine-dash"])
        .enter().append("marker")
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
		.attr("fill","transparent")
		.attr("stroke", function (d) {
            return d.color;
        })
		.attr("stroke-width", function (d) {
            if(d.updated)return 2;
			else return 1;
        });//not using css for color now
        /*.attr("class", function (d) {
            return "link " + d.type;
        })
        .attr("marker-end", function (d) {
            return "url(#" + d.type + ")";
        });*/

    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", 6)
        .call(force.drag);

    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function (d) {
            return d.name;
        });

    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(type);

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }

    // to remove the animation. adapted from http://bl.ocks.org/mbostock/1667139
    // Use a timeout to allow the rest of the page to load first.
    setTimeout(function () {
        var n = 500;
        // Run the layout a fixed number of times.
        // The ideal number of times scales with graph complexity.
        // Of course, don't run too long—you'll hang the page!
        force.start();
        for (var i = n * n; i > 0; --i) force.tick();
        force.stop();


    }, 10);
}
var scale100=d3.scale.linear().domain([0,20,50,80,100]).range(["darkred","red","yellow","green","darkgreen"]);

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