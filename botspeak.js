/**
 * BotSpeak JS - BotSpeak Chrome Extension
 * @author Rafi Yagudin
 * @version 1.0
 */

var DEVICE_IMAGES = {
	'ARDUINO_UNO'      : 'images/arduino.jpg',
	'BEAGLEBONE_BLACK' : 'images/beaglebone.jpg',
	'PROTO_SNAP'       : 'images/protosnap.png',
	'RASPBERRY_PI'     : 'images/rpi.jpg'
};
var TCP_DEVICES    = ['BEAGLEBONE_BLACK', 'RASPBERRY_PI'];
var SERIAL_DEVICES = ['ARDUINO_UNO', 'PROTO_SNAP'];
var TCP_SUCCESS    = false;
var SERIAL_TEST    = -1;
var CONNECTION_ID  = -1;
var SOCKET_ID      = -1;
var BOTSPEAK_VERSION = ['1.0'];
var SERIAL_PORTS = '';
var CMD_RESULT   = '';
var DEVICE = { 'IP': null, 'PORT': null};

(function($){

 	$( document ).ready(function(){

 		//Get the serial ports
 		chrome.serial.getPorts(function(ports){

			 SERIAL_PORTS = ports.filter(function(port) {
			    return !port.match(/[Bb]luetooth/) && port.match(/\/dev\/tty/);
			 });
			 
			 if( SERIAL_PORTS ){
				 var port_options = ''

				 SERIAL_PORTS.forEach(function(port){
				 	port_options = '<option value="' + port + '">' + port + '</div>';
				 })

				 $('#serial_ports').append(port_options);
			 }
 		});

		/**
		* Converts a string to an array buffer
		*
		* @private
		* @see   https://github.com/GoogleChrome/chrome-app-samples/blob/master/tcpserver/tcp-server.js
		* @param {String} str The string to convert
		* @param {Function} callback The function to call when conversion is complete
		*/
		function _stringToArrayBuffer(str, callback) {
			var bb = new Blob([str]);
			var f = new FileReader();
			f.onload = function(e) {
			    callback(e.target.result);
			};
			f.readAsArrayBuffer(bb);
		}

		/**
		 * Converts an array buffer to a string
		 *
		 * @see   https://github.com/GoogleChrome/chrome-app-samples/blob/master/tcpserver/tcp-server.js
		 * @private
		 * @param {ArrayBuffer} buf The buffer to convert
		 * @param {Function} callback The function to call when conversion is complete
		 */
		function _arrayBufferToString(buf, callback) {
			var bb = new Blob([new Uint8Array(buf)]);
			var f = new FileReader();
			f.onload = function(e) {
				callback(e.target.result);
			};
			f.readAsText(bb);
		}

 		//Create a TCP connection with the given 
 		var sendTCPCmd = function(hostname, port, cmd){
 			chrome.socket.create("tcp", null, function(createInfo){
 				SOCKET_ID = createInfo.socketId
 				
 				if(SOCKET_ID == -1){
 					$('#connection_status').html('Could not connect over TCP: Socket ID = -1.');
 					return;
 				}

 				if(hostname == undefined || hostname == ''){
 					hostname = '127.0.0.1';
 				}

 				if(port == undefined || port == ''){
 					port = parseInt(9999);
 				}

 				chrome.socket.connect(SOCKET_ID, hostname, port, function(result){
	 				console.log('CMD: ' + cmd);
	 				_stringToArrayBuffer(cmd + '\n', function(arrayBuffer){
	 					chrome.socket.write(SOCKET_ID, arrayBuffer, function(writeInfo){
							chrome.socket.read(SOCKET_ID, null, function(readInfo){
								_arrayBufferToString(readInfo.data, function(data){
									console.log('RESULT: ');
									console.log(data);
									CMD_RESULT = data;
								});
							})
	 					})
	 				})
 				})
 			})
 			chrome.socket.destroy(SOCKET_ID);
 			return CMD_RESULT;
 		}

 		//Test the TCP connection by sending "GET VER" over TCP/IP
 		$('#test_tcp_button').click(function(){
 			var device_ip    = $('#device_ip').val()
 			var device_port  = $('#device_port').val()
 			var botspeak_cmd = 'GET VER';
 			var version = sendTCPCmd(device_ip, device_port, botspeak_cmd);
 			if(  $.inArray(version, BOTSPEAK_VERSION) != -1 ){
 				TCP_SUCCESS = true;
 				DEVICE['IP']   = device_ip
 				DEVICE['PORT'] = device_port
 				$('#connection_status').html('<p style="color: green;">' + version + '</p>')
 			}
 		})

 		//Try to send GET VER to serial device
 		var onSerialOpen = function(openInfo){
 			console.log(openInfo);
 			CONNECTION_ID = openInfo.connectionId
			if (CONNECTION_ID == -1) {
			    alert('Could not connect to serial');
			    return;
			}
 		}

 		//opens the serial connection
		var testSerialConn = function() {
			var port = $('#serial_ports').val();
			console.log(port)
			chrome.serial.open(port, onSerialOpen);
		};

		//test serial connection
		$('#test_serial_button').click(function(){
			testSerialConn();
		})

 		//Show device info
	 	$('#device_selection').change(function(){
	 		var device  = $( this ).val();
	 		var img_src = DEVICE_IMAGES[device];
	 		
	 		//Show device image
	 		$('#device_image').html('<img src="' + img_src + '" />');
	 		
	 		//Show/hide tcp/ip serial inputs
	 		if( $.inArray(device, TCP_DEVICES) != -1 ){
	 			$('#tcp_devices').show();
	 		}else{
	 			$('#tcp_devices').hide();
	 		}

	 		if( $.inArray(device, SERIAL_DEVICES) != -1 ){
	 			$('#serial_devices').show();
	 		}else{
	 			$('#serial_devices').hide();
	 		}
	 	})

	 	//Setup the terminal interface
	    $('#terminal').terminal(function(command, term) {
	        if (command !== '') {
	            try {
	            	var device_ip = $('#device_ip').val()
	            	
	            	console.log(DEVICE);
	            	console.log(command);

					console.log('PREV CMD_RESULT: ');
	                console.log(CMD_RESULT);
	                
	                setTimeout(function(){
	                	sendTCPCmd(device_ip, 9999, command);
		                if (CMD_RESULT !== undefined) {
		                    term.echo(new String(CMD_RESULT));
							
							console.log('PREV CMD_RESULT: ');
			                console.log(CMD_RESULT);
		                }
	                }, 1000);

	            } catch(e) {
	                term.error(new String(e));
	            }
	        } else {
	           term.echo('');
	        }
	    }, {
	        enabled: false,
	        greetings: 'BotSpeak Interpreter',
	        name: 'botspeak_demo',
	        height: 300,
	        width: 400,
	        prompt: '> '
			}
	    );
 	})

})(jQuery)

