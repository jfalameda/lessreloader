/**
* Automatic LESS compiler client
* @author jose.fa@cloudnine.se
* @date 20120905
* NODE.JS required libraries:
*	http, socket.io, less, fs, watch, cli-color
*/

var compiler = require("./lesscompiler");

// Intializing the module
new compiler.LessCompiler();