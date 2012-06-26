node-sandbox
============

About
-----
node-sandbox is a safe way of running untrusted code outside of your application's node process. You can interface with code running in the sandbox via RPC (or any library that works over the node `Stream` API).

You can specify which modules the sandbox can `require()`, or you can disable `require()` altogether. Just be sure something like `net.Socket` isn't accessible via the modules you import!

License
-------
This library is Licensed under the Academic Free License version 2.1
