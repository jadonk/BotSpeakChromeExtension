/**
 * BotSpeak JS - BotSpeak Chrome Extension
 * @author Rafi Yagudin
 * @version 1.0
 */

(function($){
	var DEVICE_IMAGES = {
		'ARDUINO_UNO'      : 'images/arduino.jpg',
		'BEAGLEBONE_BLACK' : 'images/beaglebone.jpg',
		'PROTO_SNAP'       : 'images/protosnap.png',
		'RASPBERRY_PI'     : 'images/rpi.jpg'
	}
	var TCP_DEVICES    = ['BEAGLEBONE_BLACK', 'RASPBERRY_PI']
	var SERIAL_DEVICES = ['ARDUINO_UNO', 'PROTO_SNAP']
	var CONNECTION_ID  = -1
	var SOCKET_ID      = -1
	var SERIAL_PORTS

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

 		//Create a TCP connection with the given 
 		var openTCP = function(hostname, port){
 			chrome.socket.create("tcp", null, function(createInfo){
 				SOCKET_ID = createInfo.socketId
 				if(SOCKET_ID == -1){
 					$('#connection_status').html('Could not connect over TCP: Socket ID = -1.');
 					return;
 				}

 				chrome.socket.connect(SOCKET_ID, hostname, 9999, function(result){
 					console.log('Connection result: ');
 					console.log(result);

	 				_stringToArrayBuffer('GET VER\n', function(arrayBuffer){
	 					console.log(arrayBuffer);
	 					
	 					chrome.socket.write(SOCKET_ID, arrayBuffer, function(writeInfo){
							console.log('writeInfo: ');
	 						console.log(writeInfo);
	 					})
						
	 				})
 				})
 			})
 			chrome.socket.destroy(SOCKET_ID);
 		}

 		//Test the connection by sending "GET VER" over TCP/IP
 		$('#test_tcp_button').click(function(){
 			openTCP('127.0.0.1');
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
 	})

})(jQuery)

