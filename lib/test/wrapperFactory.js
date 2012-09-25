
suite("wrapperFactory - creates wrapped/restricted functions", function(){
    test("require loads global modules that are allowed");
    test("require doesn't load global modules that aren't allowed");
    test("global modules can be specified via wildcard");
    test("require loads local modules that are allowed");
    test("require doesn't load local modules that aren't allowed");
    test("local modules can be specified via wildcard");
});
