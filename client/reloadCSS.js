/**
* Less compiler client
* @author jose.fa@cloudnine.se
* @date 20120905
*/
(function() {
	
	/**
	* Reloads the styles based on the list
	* retrieved from the server.
	* @param list The list of modifyed files
	*		sent by the server.
	*/
	function reloadStylesheets(list) {
		var queryString = '?reload=' + new Date().getTime();
		$('link[rel="stylesheet"]').each(function () {
			var replace = false;
			
			for(var a = 0; a < list.length; a++) {
				if(this.href.indexOf(list[a].css) != -1) {
					this.href = this.href.replace(/\?.*|$/, queryString);
				}
			}
			
		});
	}
	/**
	* Creates the panel where the errors will be displayed
	*/
	function createErrorPanel() {
		var panel = $('<div style="position: fixed; top: 0; left: 0; padding:10px; width: 100%; border: 2px solid red; background: white; display: none;"></div>');
		$("body").prepend(panel);
		return panel;
	}
	
	// On document ready
	$(function() {
		// Creating the errors panel
		var panel = createErrorPanel();
		
		// Loading the socket.io library from the node.js server
		$.getScript('http://'+window.location.hostname+':8181/socket.io/socket.io.js', function() {
			// Setting up the connection to the server
			var socket = io.connect('http://'+window.location.hostname+':8181');
			// Listening to lesscompiled event
			socket.on('lesscompiled', function (data) {
				var error = false;
				// Empty the panel from previous error messages
				panel.empty();
				// Goigng through all the retrieved items and cheching
				// For errors on the files compilation. In case an error
				// Has been found it will be added to the error panel.
				for(var i = 0; i < data.files.length; i++) {
					if(data.files[i].error) {
						error = true;
						panel.append('<div><h3 style="color: red;">'+data.files[i].error.filename+'</h3><p>'+data.files[i].error.message+'</p></div>');
					}
				}
				// Showing or hidding the error panel
				// depending of if there is errors or not.
				if(error) {
					panel.show();
				} else {
					panel.hide();
				}
				
				// Reloading the stylesheets
				reloadStylesheets(data.files);
			});
			
		});
	});
	
})(window, $);