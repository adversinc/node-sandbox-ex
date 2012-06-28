var Sandbox = require("../Sandbox")
  , path = require('path')
  , assert = require("assert");

suite("Sandbox - main sandbox class", function(){
    var TEST_CODE_PATH = path.join(__dirname, "/support/sandboxed_code.js");
    var TEST_BAD_CODE_PATH = path.join(__dirname, "/support/causes_timeout.js");

    
    test("Sandbox starts", function(done){
        var sb = new Sandbox(TEST_CODE_PATH);
        sb.run();

        sb.on("ready", function(){
            assert(sb.isRunning);
            done();
        });
    });
    
    test("Calling methods via RPC", function(done){
        var sb = new Sandbox(TEST_CODE_PATH);
        sb.run();

        //DEBUG CODE
        /*
        sb._process.stderr.setEncoding("utf8");
        sb._process.stderr.on("data", function(data){
            console.log(data);
        });
        sb._process.stdout.setEncoding("utf8");
        sb._process.stdout.on("data", function(data){
            console.log(data);
        });
        //*/

        sb.on("ready", function(){
            assert(sb.isRunning);
            sb.rpc.call("someCommand", {foo: "bar"}).then(function(data){
                assert.deepEqual({foo: "bar"}, data);
                done();
            });
        });
    });
    
    test("Sandbox generates 'stderr' events", function(done){
        var sb = new Sandbox(TEST_CODE_PATH);
        sb.run();

        sb.once("stderr", function(data){
            assert.equal("This is an error!", data.toString());
            done();
        });
    });
    
    test("Sandbox generates 'ping' events");

    test("Sandbox generates 'timeout' events, and kills processes");
});
