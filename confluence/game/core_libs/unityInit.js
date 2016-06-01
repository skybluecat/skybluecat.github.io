		var config = {
			width: 800,
			height: 600,
			params: { enableDebugging:"0" }
			
		};
		u = new UnityObject2(config);

		jQuery(function() {

			var $missingScreen = jQuery("#unityPlayer").find(".missing");
			var $brokenScreen = jQuery("#unityPlayer").find(".broken");
			$missingScreen.hide();
			$brokenScreen.hide();
			
			u.observeProgress(function (progress) {
				switch(progress.pluginStatus) {
					case "broken":
						$brokenScreen.find("a").click(function (e) {
							e.stopPropagation();
							e.preventDefault();
							u.installPlugin();
							return false;
						});
						$brokenScreen.show();
					break;
					case "missing":
						$missingScreen.find("a").click(function (e) {
							e.stopPropagation();
							e.preventDefault();
							u.installPlugin();
							return false;
						});
						$missingScreen.show();
					break;
					case "installed":
						$missingScreen.remove();
					break;
					case "first":
					break;
				}
			});
			u.initPlugin(jQuery("#unityPlayer")[0], "Build.unity3d");
			toUnity = function (object, functionToCall, argument)
			{
			    console.log("Sending message to unity: " + object + " " + functionToCall + " " + argument);
			    u.getUnity().SendMessage(object, functionToCall, argument);
			}
		});