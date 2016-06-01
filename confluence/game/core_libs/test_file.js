define(["util", "underscore"],
    function (util, _) {

// var hash = objectHash.sha1({foo:'bar'});
// //var hash = object_hash.objectHash.sha({foo: 'bar'});
//
// console.log(hash); // e003c89cdf35cdf46d8239b4692436364b7259f9

        var arr = [];
        for(var i = 0; i < 100; i++){
            var inside = [];
            for(var j = 0; j < 10; j++){
                inside.push({
                    "num": j,
                    "name": "thisname" + j
                });
            }
            arr.push(inside);
        }
        console.log("array clone test:")
        console.log(arr);

        var cloneArray = util.clone(arr);
        console.log("is clone same as original");
        console.log(_.isEqual(arr, cloneArray));

        cloneArray[0] = 1;

        console.log("changed clone array. test if equal again");
        console.log(_.isEqual(arr, cloneArray));
    });