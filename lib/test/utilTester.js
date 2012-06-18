var assert = require("assert")
//  , fs = require("fs")
  , util = require("./util");

suite("sandbox/utilTester (part of test suite)", function(){
    var SOCK_PATH = "./test/support/test_socket.sock";
    var sock;
    var sock_listener;

    suiteSetup(function(done){
        util.socketPair(SOCK_PATH, function(one, two){
            sock = one;
            sock_listener = two;
            done();
        });
    });

    suiteTeardown(function(){
        sock.destroy();
        //fs.writeFileSync(SOCK_PATH, "");
    });

    test("stream is piping from the first to the second correctly", function(done){
        sock.setEncoding("utf8");
        sock_listener.setEncoding("utf8");
        sock_listener.on("data", function(data){
            assert.equal(data, "test");
            done();
        });
        sock.write("test");
    });
    test("stream is piping from the second to the first correctly", function(done){
        sock.setEncoding("utf8");
        sock_listener.setEncoding("utf8");
        sock.on("data", function(data){
            assert.equal(data, "test");
            done();
        });
        sock_listener.write("test");
    });
});
