module.exports = {
	port: 8181, // Server port
	serverLogLevel: 1, // Server verbose level
	paths: ['../../less/spl'], // LESS files path
	
	//Files to be compiled and the route for the out CSS
	lessFiles: [
		{ src: "../../less/spl/spl.less", css: "../../css/compiled/spl.css", ready: false },
		{ src: "../../less/spl/ie7.less", css: "../../css/compiled/ie7.css", ready: false }
	]
};