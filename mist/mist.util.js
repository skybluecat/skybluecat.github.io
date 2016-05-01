	
//utility functions
function parseInputSequence()
{
	var temptext=document.getElementById("inputSequence").value;
	if(temptext.match("^\\d+$"))
	{
		return Number(temptext);
	}
	if(temptext.match("^A\\d+$"))
	{
		return Number(temptext.substring(1,temptext.length));
	}
	//TODO: what if the user searched for text name or first terms?
}



//used for downloading data objects in the schema now

//downloading an attribute of all sequences; deprecated
function downloadSubFile(someSequences, someAttribute, downloadnumber)
{
	var data;var properties = {type: 'plain/text'}; // Specify the file's mime-type.
	data = ["[\n"];
		for(var i in someSequences)
		{
			if((typeof someSequences[i]=="object")&&(typeof someSequences[i][someAttribute]!= "undefined"))
			{
				data.push(JSON.stringify({oeis_id:someSequences[i].oeis_id, value:someSequences[i][someAttribute]}));
			}
				data.push(",\n");
		}
		data.pop();//remove the last comma
		data.push("\n]");
	
	var pom = document.createElement('a');
		pom.setAttribute('download', "mist_"+someAttribute+"_"+downloadnumber+".json");//added prefix for sorting files by name; mist means custom generated property while oeis means original data
		var file = new File(data, "file.txt", properties);
		var url = URL.createObjectURL(file);
		pom.href = url;
		if (document.createEvent) {
			var event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
			}
			else {
				pom.click();
			}
}

function download(someAttribute)
{
	//this is for downloading a custom property generated through user interaction
	var i;var downloadnumber=1;
	for(i=0;i<oeis.length;i+=chunkSize)//hack: load in chunks and download in the same chunks too
	{
			var sequences=oeis;//.slice(i,i+chunkSize);//now the oeis in indexed by A number so has undefined entries
			downloadSubFile(sequences,someAttribute,downloadnumber);//download a given aspect of all sequences; the attribute name is a string that is both the object attribute and the filename prefix
			downloadnumber++;
	}
	//no remaining partial chunk because we use i+chunkSize
}


//downloading a single object
function downloadObject(Obj,name)
{
	var data=[];var properties = {type: 'plain/text'}; // Specify the file's mime-type.
	data.push(JSON.stringify(Obj));
	var pom = document.createElement('a');
		pom.setAttribute('download', "mist_"+name+".json");//added prefix for sorting files by name; mist means custom generated property while oeis means original data, file means some kind of global data not belonging to any sequence
		var file = new File(data, "file.txt", properties);
		var url = URL.createObjectURL(file);
		pom.href = url;
		if (document.createEvent) {
			var event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
			}
			else {
				pom.click();
			}
}
