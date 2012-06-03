var Server = require("../lib/rpc/Server");
var Client = require("../lib/rpc/Client");
var Duplex = require("../lib/rpc/Duplex");
var util = require("./util");
var Promise = require("promise/promise").Promise;

suite("rpc/* - utility classes for calling functions over a stream", function(){
    var stream1;
    var stream2;

    //dummy RPC methods for testing
    var rpc_methods = {
        add: function(a, b){
            return a+b;
        },
        
        async: {
            add: function(a, b){
                var p = new Promise();
                setTimeout(function(){
                    p.emitSuccess(a+b);
                }, 150);
                return p;
            }
        }
    }

    setup(function(done){
        util.socketpair(stdin_path, function(one, two){
            stream1 = one;
            stream2 = two;
            done();
        });        
    });

    teardown(function(){
        stream1.destroy();
        stream2.destroy();
    });


    //test methods, we use each function for both client->server and duplex<->duplex
    var tests = {
        _call_methods: function(client, server, methods, done){
            
        },

        exposing_methods: function(client, server, done){
            var s = new Server(stream1);
            var c = new Client(stream2);

            s.exposeMethod("add", rpc_methods.add);
            s.exposeMethod("async.add", rpc_methods.async.add);

            this._call_methods(c, s, {
                "add": {
                    args: [2,3],
                    result: 5
                },
                "async.add": {
                    args: [2,3],
                    result: 5
                }
            }, done);
        },

        exposing_object: function(client, server, done){
            var s = new Server(stream1);
            var c = new Client(stream2);

            s.exposeObject(rpc_methods);
            this._call_methods(c, s, {
                "add": {
                    args: [2,3],
                    result: 5
                },
                "async.add": {
                    args: [2,3],
                    result: 5
                }
                
            }, done);
        }
        //TODO: test for when methods raise errors or when a method isn't found

        //TODO: SMD tests
    }

    test("A normal thing", function(done){
        //fuck.
    });
});
