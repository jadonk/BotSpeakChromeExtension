This is the BotSpeak Chrome Extension. You can send BotSpeak commands to a variety of devices using serial and TCP/IP connections.

Before loading everything, connect all the devices you need to program to your USB ports. Otherwise you will have to restart the Chrome extension everytime you connect a new USB device.

To load this in Chrome, got to Tools -> Extensions

In the Extensions page, click on "Load unpacked extension" and navigate to the directory of the Extension and click "open"

The extension should now show up in the main list of extensions.

To launch the BotSpeak Chrome extension, click "Launch".

To get TinySpeak working (for Atmega/Arduino compatible devices), launch the TinySpeakServer.vi on labview and run it. This will create a local (127.0.0.1:9999) TCP server that the chrome extension will connect to. Chrome will send it botspeak commands over TCP, and the TinySpeakServer will then convert them to the correct bytecodes to send over serial.