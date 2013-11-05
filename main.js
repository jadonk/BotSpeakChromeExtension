/**
 * BotSpeak JS for the BotSpeak Chrome Extension
 * @author Rafi Yagudin
 * @date   4/11/2013
 * @version 1.0
 */
var main_window

chrome.app.runtime.onLaunched.addListener(function(){
	chrome.app.window.create('index.html',{ 
			id : "main_window", 
			bounds : {width: 1024, height: 640, left: 0, top: 0}
		})
})