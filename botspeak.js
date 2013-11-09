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
var TCP_DEVICE_SELECTED    = true; //Since the default is Raspberry Pi
var SERIAL_DEVICE_SELECTED = false;
var TCP_DEVICES    = ['BEAGLEBONE_BLACK', 'RASPBERRY_PI'];
var SERIAL_DEVICES = ['ARDUINO_UNO', 'PROTO_SNAP'];
var TCP_SUCCESS    = false;
var SERIAL_TEST    = -1;
var CONNECTION_ID  = -1;
var SOCKET_ID      = -1;
var BOTSPEAK_VERSION = ['1.0', '9'];
var SERIAL_PORTS = '';
var CMD_RESULT   = '';
var DEVICE = { 'IP': null, 'PORT': null};

(function($){

 	$( document ).ready(function(){

 		//Get the serial ports every 10 seconds in case thing get attached
 		chrome.serial.getPorts(function(ports){

			 SERIAL_PORTS = ports.filter(function(port) {
			    return !port.match(/[Bb]luetooth/) && port.match(/\/dev\/tty/);
			 });
			 
			 if( SERIAL_PORTS ){
				 var port_options = ''

				 SERIAL_PORTS.forEach(function(port){
				 	port_options += '<option value="' + port + '">' + port + '</div>';
				 })

				 $('#serial_ports').html(port_options);
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

 		/**
 		 * Send a command over TCP/IP
 		 * 
 		 * @string hostname - IP address or hostname of the device to connect to. Default: 127.0.0.1 (localhost)
 		 * @int port   - The port to connect on. Default is 9999.
 		 * @string cmd - The command to send over TCP/IP
 		 * @callback   - callback of the form callback(arrayBufferResult) where ArrayBufferResult is an arrayBuffer of the data read back via TCP/IP
 		 */
 		var sendTCPCmd = function(hostname, port, cmd, callback){
 			chrome.socket.create("tcp", null, function(createInfo){
 				SOCKET_ID = createInfo.socketId
 				
 				if(SOCKET_ID == -1){
 					$('#tcp_devices').append('<p style="color: red;">Could not connect over TCP: Socket ID = -1.</p>');
 					return;
 				}

 				if(hostname == undefined || hostname == ''){
 					hostname = '127.0.0.1';
 				}

 				if(port == undefined || port == ''){
 					port = 9999;
 				}

 				chrome.socket.connect(SOCKET_ID, hostname, port, function(result){
	 				console.log('CMD: ' + cmd);
	 				_stringToArrayBuffer(cmd + '\r\n', function(arrayBuffer){
	 					chrome.socket.write(SOCKET_ID, arrayBuffer, function(writeInfo){
							chrome.socket.read(SOCKET_ID, null, function(readInfo){
								callback(readInfo.data);
							})
	 					})
	 				})
 				})
 			})
 			chrome.socket.destroy(SOCKET_ID);
 		}

 		//Test the TCP connection by sending "GET VER" over TCP/IP
 		$('#test_tcp_button').click(function(){
 			var device_ip    = $('#device_ip').val()
 			var device_port  = $('#device_port').val()
 			var botspeak_cmd = 'GET VER';
 			sendTCPCmd(device_ip, device_port, botspeak_cmd, function(arrayBufferResult){
				_arrayBufferToString(arrayBufferResult, function(version){
		 			console.log('version: ')
		 			console.log(version)
		 			if(  $.inArray(version, BOTSPEAK_VERSION) != -1 ){
		 				TCP_SUCCESS = true;
		 				DEVICE['IP']   = device_ip
		 				DEVICE['PORT'] = device_port
		 				$('#tcp_devices').append('<p style="color: green;">Connection successful! BotSpeak Version: ' + version + '</p>')
		 			}else{
		 				$('#tcp_devices').append('<p style="color: red;"> Connection Error: ' + version + '</p>')
		 			}
				});
 			});
 		})

 		/**
 		 * Send a serial comand
 		 * @param serial_cmd ArrayBuffer of TinySpeak commands
 		 */
		var sendSerialCmd = function(port, serial_cmd) {
			
			console.log(port)
			
			chrome.serial.open(port, null, function(openInfo){
	 			CONNECTION_ID = openInfo.connectionId
				if (CONNECTION_ID == -1) {
				    console.log('Could not connect to serial');
				    return;
				}
				chrome.serial.write(CONNECTION_ID, serial_cmd, function(writeInfo){
					
					console.log('writeInfo: ');
					console.log(writeInfo);
					
					chrome.serial.read(CONNECTION_ID, 8, function(readInfo){
						console.log('serial readinfo: ');
						console.log(readInfo)

						var uint8View = new Uint8Array(readInfo.data);
						console.log('serial uint8View: ');
						console.log(uint8View);
						
						
						console.log('------------');
					})
				})
			});
			chrome.serial.close(CONNECTION_ID, function(result){ console.log('Serial closed: ' + result) });
		};

		//test serial connection
		$('#test_serial_button').click(function(){
			
			//Get TinySpeak from LabView TCP server
			sendTCPCmd(null, null, 'SET DIO[13], 1', function(labview_result){
				var uint8View = new Uint8Array(labview_result);
				
				console.log('serial command: ');
				console.log(uint8View);
				
				var port = $('#serial_ports').val();
				sendSerialCmd(port, labview_result);
			});
		})

 		//Show device info
	 	$('#device_selection').change(function(){
	 		var device  = $( this ).val();
	 		var img_src = DEVICE_IMAGES[device];
	 		
	 		//Show device image
	 		$('#device_image').html('<img src="' + img_src + '" />');
	 		
	 		//Show/hide tcp/ip serial inputs
	 		if( $.inArray(device, TCP_DEVICES) != -1 ){
	 			TCP_DEVICE_SELECTED = true;
	 			$('#tcp_devices').show();
	 		}else{
	 			TCP_DEVICE_SELECTED = false;
	 			$('#tcp_devices').hide();
	 		}

	 		if( $.inArray(device, SERIAL_DEVICES) != -1 ){
	 			SERIAL_DEVICE_SELECTED = true;
	 			$('#serial_devices').show();
	 		}else{
	 			SERIAL_DEVICE_SELECTED = false;
	 			$('#serial_devices').hide();
	 		}
	 	})

	 	//Setup the terminal interface
	    $('#terminal').terminal(function(command, term) {
	        
	        if (command !== '') {
	            try {

	            	console.log('TCP_DEVICE_SELECTED: ' + TCP_DEVICE_SELECTED)
	            	console.log('SERIAL_DEVICE_SELECTED: ' + SERIAL_DEVICE_SELECTED)

	            	if(TCP_DEVICE_SELECTED){
		            	var device_ip = $('#device_ip').val()
	                	sendTCPCmd(device_ip, 9999, command, function(arrayBufferResult){
		                    _arrayBufferToString(arrayBufferResult, function(cmd_result){
								term.echo(new String(cmd_result));
		                    });
	                	});
                	}

                	if(SERIAL_DEVICE_SELECTED){
						//Get TinySpeak from LabView TCP server
						sendTCPCmd(null, null, command.trim(), function(arrayBufferResult){
							var uint8View  = new Uint8Array(arrayBufferResult);
							var bufferTest = new ArrayBuffer(uint8View.length - 1)
							var uint8test  = new Uint8Array(bufferTest)

							for(var i = 0; i < uint8View.length - 1; i++){
								uint8test[i] = uint8View[i];
							}
								
							console.log('serial command: ');
							console.log(uint8test);

							var port = $('#serial_ports').val();
							sendSerialCmd(port, bufferTest);
						});
                	}

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

