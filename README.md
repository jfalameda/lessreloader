LESS reloader for node.js
====

LESS reloader listens for any changes on a folder containing LESS files and automatically compiles them into CSS and notifies all the browsers reading the CSS to reload it.

This pretends to be a node.js emulation of Livreload.

How to use
----

First of all you need to instal the latest version of node.js. Once this has been done, install all the dependencies using NPM:
```
	npm install watch http socket.io less fs cli-color
```
	
Also you need to move the file reloadCSS.js into your site and include it on your header. Also remember to include the CSS styles that will be compiled on the header section. The script will look for them on the header in order to reload them.

Configuring the node.js app
----

Start by set up the path to your less files and the destination for the CSS files on config.js

```javascript

module.exports = {
	port: 8181, // Server port
	serverLogLevel: 1, // Server verbose level
	paths: ['less'], // LESS files path
	
	//Files to be compiled and the route for the out CSS
	lessFiles: [
		{ src: "less/main.less", css: "main.css", ready: false },
		{ src: "less/ie7.less", css: "ie7.css", ready: false }
	]
};

```

When all this has been done, we can start the server application. Move to the folder and call app.js using node.

	node app.js
	
Now open your website on few browser windows, Change a property on your code and see the changes instantly on the windows!
