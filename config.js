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