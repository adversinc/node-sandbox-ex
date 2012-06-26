var DuplexStream = require("../DuplexStream");
var util = require("./util");
var assert = require("assert");

suite("DuplexStream - Utility class for combining a read-only and a write-only stream", function(){
    var SOCK_PATH = "./test/support/test_socket.sock";
    var SOCK_PATH_TWO = "./test/support/second_test_socket.sock";

    //routing: writeSock1 -> readSock1, writeSock2 -> readSock2
    var readSock1;
    var readSock2;
    var writeSock1;
    var writeSock2;

    var fixReadSock = function(sock){
        //this function deletes all the write functions from the stream API.
        //we don't need to fix the write socket because if nothing is being
        //written from the other end, the read events won't be emitted.
        
        sock.writeable = false;
        delete sock.write;
        delete sock.end;
    }

    setup(function(done){
        util.socketPair(SOCK_PATH, function(one, two){
            readSock1 = one;
            writeSock1 = two;

            util.socketPair(SOCK_PATH_TWO, function(one, two){
                readSock2 = one;
                writeSock2 = two;
                
                //fix the read sockets so they don't have the ability to write
                fixReadSock(readSock1);
                fixReadSock(readSock2);
                done();
            });
        });
        
    });

    teardown(function(){
        readSock1.destroy();
        readSock2.destroy();
        writeSock1.destroy();
        writeSock2.destroy();
    });

    test("DuplexStream read API", function(done){
        var ds = new DuplexStream(readSock1, writeSock2);
        var str = "TEST STRING\n";

        ds.on("data", function(data){
            assert(data, str);
        });
        ds.on("end", function(){
            done();
        });
        writeSock1.write(str);
        writeSock1.end();
    });
    
    test("DuplexStream write API", function(done){
        var ds = new DuplexStream(readSock1, writeSock2);
        var str = "TEST STRING\n";
        
        readSock2.on("data", function(data){
            assert(data, str);
        });
        readSock2.on("end", function(){
            done();
        });
        ds.write(str);
        ds.end();
    });
});
