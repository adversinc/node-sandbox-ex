var net = require("net");

var util = module.exports = {
    socketPair: function(socketPath, onFinish){
        var socketOne, socketTwo;

        var server = net.createServer(function(c){
            socketOne = c;
                onFinish(socketOne, socketTwo);
        });

        server.listen(socketPath, function(){
            socketTwo = net.connect(socketPath, function(){
            });
        });
    }
};
