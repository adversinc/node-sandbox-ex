var Server = require("../rpc/Server");
var Client = require("../rpc/Client");
var Duplex = require("../rpc/Duplex");
var util = require("./util");
var Promise = require("node-promise/promise").Promise;
var assert = require("assert");

suite("rpc/* - utility classes for calling functions over a stream", function(){
    var stream1;
    var stream2;

    var TEST_SOCKET_PATH = "./test/support/test_socket.sock";
    var TEST_OBJ = {
        someNum: 5,
        someBool: true,
        someObj: {
            someArr: [2,"yes", true],
            someString: "foo"
        }
    };

    //dummy RPC methods for testing
    var rpc_methods = {

        add: function(a, b){
            return a+b;
        },

        objectArgs: function(obj){
            return obj;
        },
        
        async: {
            add: function(a, b){
                var p = new Promise();
                setTimeout(function(){
                    p.emitSuccess(a+b);
                }, 150);
                return p;
            }
        },
        error: {
            add: function(a, b){
                throw new Error("Something broke");
                return a+b;
            },
            add_async: function(a, b){
                var p = new Promise();
                setTimeout(function(){
                    p.emitError(new Error("Something broke"));
                }, 150);
                return p;
            }/*,
            add_throws_async: function(a, b){
                var p = new Promise();
                setTimeout(function(){
                    throw new Error("Something broke");
                }, 150);
                return p;
            }*/
        }
    }

    setup(function(done){
        util.socketPair(TEST_SOCKET_PATH, function(one, two){
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
            var completed = {};
            
            //this gets called after each method finishes
            //and checks if we're still waiting on methods
            var check_finished = function(methodName){
                completed[methodName] = true;
                for(var i in methods){
                    if(!completed[i]) return;
                }
                done();
            }

            //go through each method and call it, comparing it's behavior to the result we expect
            for(var method in methods){
                var info = methods[method];

                client.call(method, info.args).then(function(result){
                    if(!info.error)
                        assert.deepEqual(info.result, result);
                    else
                        throw new Error("got a response when we should have gotten an error for \""+method+"\"! ("+result+")");

                    check_finished(method);
                }, function(error){
                    if(info.error)
                        assert.deepEqual(error.message, info.error);
                    else
                        throw new Error("got an error ("+error.message+") when we should have gotten a response for \""+method+"\"!");
                    check_finished(method);
                });

            }
        },

        exposing_methods: function(c, s, done){

            s.expose("add", rpc_methods.add);
            s.expose("objectArgs", rpc_methods.objectArgs);
            s.expose("async.add", rpc_methods.async.add);
            s.expose("error.add", rpc_methods.error.add);
            s.expose("error.add_async", rpc_methods.error.add_async);
            //s.expose("error.add_throws_async", rpc_methods.error.add_throws_async);

            this._call_methods(c, s, {
                "add": {
                    args: [2,3],
                    result: 5
                },
                "objectArgs": {
                    args: TEST_OBJ,
                    result: TEST_OBJ
                },
                "async.add": {
                    args: [2,3],
                    result: 5
                },
                "error.add": {
                    args: [2,3],
                    error: "Something broke"
                },
                "error.add_async": {
                    args: [2,3],
                    error: "Something broke"
                }/*,
                "error.add_throws_async": {
                    args: [2,3],
                    error: "Something broke"
                }*/
            }, done);
        },

        exposing_object: function(c, s, done){

            s.exposeObject(rpc_methods);
            this._call_methods(c, s, {
                "add": {
                    args: [2,3],
                    result: 5
                },
                "objectArgs": {
                    args: TEST_OBJ,
                    result: TEST_OBJ
                },
                "async.add": {
                    args: [2,3],
                    result: 5
                },
                "error.add": {
                    args: [2,3],
                    error: "Something broke"
                },
                "error.add_async": {
                    args: [2,3],
                    error: "Something broke"
                }/*,
                "error.add_throws_async": {
                    args: [2,3],
                    error: "Something broke"
                }*/
            }, done);
        },

        method_not_found_error: function(c, s, done){

            s.exposeObject(rpc_methods);
            c.call("nonexistant_method", [1, 3]).then(function(){
                throw new Error("Got a response from a method that doesn't exist!");
                done();
            }, function(error){
                assert.equal(error.code, Server.METHOD_NOT_FOUND);
                done();
            });
        },

        notifications: function(c, s, done){
            s.expose("testMethod", function(a, b){
                assert.equal(a, 2);
                assert.equal(b, 3);
                done();
            });
            c.call("testMethod", [2,3]);
        }

        //TODO: SMD tests
    }


    //actual tests that we can test both duplex and client->server com with

    test("client->server method exposing", function(done){
        var c = new Client(stream1);
        var s = new Server(stream2);
        tests.exposing_methods(c, s, function(){
            tests.exposing_objects(c, s, done);
        });
    });
    
    test("client->server invalid method tests", function(done){
        var c = new Client(stream1);
        var s = new Server(stream2);
        tests.method_not_found_error(c, s, done);
    });
    
    test("client->server notifications", function(done){
        var c = new Client(stream1);
        var s = new Server(stream2);
        tests.notifications(c, s, done);
    });
    
    test("duplex<->duplex method exposing", function(done){
        var d1 = new Duplex(stream1);
        var d2 = new Duplex(stream2);
        tests.exposing_methods(d1, d2, function(){
            tests.exposing_objects(d1, d2, function(){
                test.exposing_methods(d2, d1, function(){
                    test.exposing_objects(d2, d1, done);
                });
            });
        });
    });
    
    test("duplex<->duplex invalid method tests", function(done){
        var d1 = new Duplex(stream1);
        var d2 = new Duplex(stream2);
        tests.method_not_found_error(d1, d2, function(){
            tests.method_not_found_error(d2, d1, done);
        });
    });
    
    test("duplex<->duplex notifications", function(done){
        var d1 = new Duplex(stream1);
        var d2 = new Duplex(stream2);
        tests.notifications(d1, d2, function(){
            tests.notifications(d2, d1, done);
        });
    });
});
