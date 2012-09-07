var watch = require("watch");
var app = require('http').createServer();
var io = require('socket.io').listen(app);
var less = require('less');
var fs = require('fs');
var clc = require('cli-color');
var options = require("./config.js");

/**
* Implemets all the functionality for compiling the LESS files,
* listen to changes on the given folders files and creating
* the server for comunicating the CSS changes to the connected
* clients.
*/
var LessCompiler = function() {
	this.init();
}; LessCompiler.prototype = {
	
	/**
	* Stores on a list all the connected clients
	* in order to notify them later when needed.
	* @type Array
	*/
	globalSocket: null,
	
	
	
	/**
	* Module consctructor
	*/
	init: function() {
		this.globalSocket = [];
		this.setUpServer();
		this.addDirectoryObserver();
		this.lessFiles = options.lessFiles;
	},
	
	/**
	* Sets up the HTTP server and
	* the socket IO.
	*/
	setUpServer: function() {
		var $this = this;
		app.listen(options.port);
		io.set('log level', options.serverLogLevel);
		// creating a new websocket to keep the content updated without any AJAX request
		io.sockets.on( 'connection', function ( socket ) {
			console.log(clc.yellow("Client connected"));
			$this.globalSocket.push(socket);
			$this.performCompilation();
		});
	},
	
	/**
	* Checks for any change of the files of the given
	* directory. In case something has change it will
	* re-compile the LESS files and notify the clients
	* the CSS has changed.
	*/
	addDirectoryObserver: function() {
		var $this = this;
		watch.watchTree('../../less', { interval: 50}, function (f, curr, prev) {
			$this.performCompilation();
		});
	},
	
	/**
	* Perorms the compilation of the LESS files
	*/
	performCompilation: function() {
		var $this = this;
		console.log("=============   File changed  ================");
		console.log((new Date()).toString());
		
		this.compileLessFilesList(function() {
			$this.onCompilationPerformed();
		});
	},
	
	/**
	* This callback will be called when all the files
	* has been compiled or tried to and in case there
	* is no error the new CSS files has been created.
	* Then it will take care of notify all the clients
	* about the new CSS created and will send a list
	* with the new CSS files created.
	*/
	onCompilationPerformed: function() {
		console.log(clc.blue.bright("All files ready"));
		if(this.globalSocket.length > 0) {
			for(var i = 0; i < this.globalSocket.length; i++) {
				try {
					this.globalSocket[i].emit('lesscompiled', { compiled: true, files: this.lessFiles });
				} catch(err) {

				}
			}
		}
	},
	/**
	* Compiles a given LESS file and stores it on the given route.
	* It also takes care of error handling and to call the callbacks
	* to indicate all the files has been compiled.
	* @param src The source of the LESS file
	* @param to The target for the CSS file
	* @param file The key of the file stored on lessFiles attribute
	*		this will be used to add the error messages in case
	*		there is or to indicate the compilation has been
	*		performed.
	* @param callback The function that will be called one the
	*		compilation process has been done.
	*/
	compileFile: function(src, to, file, callback) {
		
		var $this = this;
		
		this.deleteFile(to);

		this.lessFiles[file].error = null;
		var parser = this.createLessParser(src);

		fs.readFile(src, 'ascii', function(err,data){
			if(err) {
				console.log(clc.red("Could not open file: %s"), err);
			}
			$this.compileLess(parser, data, callback, src, to, file);
		});


	},
	
	/**
	* Compiles a given LESS code.
	* @param data The data to compile
	* @param src The source of the LESS file
	* @param to The target for the CSS file
	* @param file The key of the file stored on lessFiles attribute
	*		this will be used to add the error messages in case
	*		there is or to indicate the compilation has been
	*		performed.
	* @param callback The function that will be called one the
	*		compilation process has been done.
	*/
	compileLess: function(parser, data, callback, src, to, file) {
		var $this = this;
		parser.parse(data, function(err, tree) {

			var skipSave = false;

			if(err) {
				skipSave = $this.registerError(file,err,callback);
			} else {
				var cssCode = null;
				try {
					cssCode = tree.toCSS({compress: true});
				} catch(error) {
					skipSave = $this.registerError(file,error,callback);
				}
				if(!skipSave) {
					$this.saveFile(to, cssCode, callback, file);
				}
			}
		});
	},
	
	/**
	* Saves the CSS content on a given file.
	* @param to The destination file
	* @param cssCode The file content
	* @param callback The callback function to call
	*		once the file is saved.
	* @param file The file key contained on lessFile attribute.
	*/
	saveFile: function(to, cssCode, callback, file) {
		var $this = this;
		fs.writeFile(to, cssCode , function(err) {
			if(err) {
				console.log(err);
			} else {
				$this.lessFiles[file].ready = true;
				console.log(clc.green("Compiled CSS saved: "+to));
				callback();
			}
		});
	},
	
	/**
	* Takes care of printing an error and storing
	* it on lessFiles in order to be sent later to
	* the connected clients.
	*/
	registerError: function(file, error, callback) {
		less.writeError(error, {
			color: true
		});
		this.lessFiles[file].ready = true;
		this.lessFiles[file].error = error;
		callback();
		return true;
	},
	
	/**
	* Deletes a given file.
	* @param to The file path
	*/
	deleteFile: function(to) {
		try {
			fs.unlinkSync(to);
		} catch(e) {}
	},
	
	/**
	* Creates the instance of the less parser.
	* @param src The source of the LESS file.
	*/
	createLessParser: function(src) {
		return new(less.Parser)({
			paths: options.paths, // Specify search paths for @import directives
			file: src,
			strictImports: true
		});
	},
	
	/**
	* Goes through the list of LESS files to be compiled
	* and compiles them.
	*/
	compileLessFilesList: function(callback) {
		var $this = this;
		
		var ready = function() {
			$this.onCompilationReady(callback);
		};

		for(var i = 0; i < this.lessFiles.length; i++) {
			this.compileFile(this.lessFiles[i].src, this.lessFiles[i].css, i, ready);
		}
	},
	
	/**
	* This function is called once the compilation
	* process has finished.
	*/
	onCompilationReady: function(callback) {
		var a;
		var ready = true;
		for(a = 0; a < this.lessFiles.length; a++) {
			if(!this.lessFiles[a].ready) {
				ready = false;
			}
		}
		if(ready === true) {
			callback();
			for(a = 0; a < this.lessFiles.length; a++) {
				this.lessFiles[a].ready = false;
			}
		}
	}
};

/**
* Exporting the module
*/
module.exports = {
	LessCompiler: LessCompiler
};












