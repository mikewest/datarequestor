DataRequestor
=============

DataRequestor is a JavaScript wrapper for the `XMLHttpRequest` object that enables the trivial implementation of dynamic interfaces without the painful necessity for a complete page-refresh to talk to the server. In other words: Ajax without the confusing API.

How can you use DataRequestor?
------------------------------

When building applications, the most typical Ajaxy sort of thing I find myself doing is sending off data to a server-side script, and then sticking the resulting HTML directly into some element on the page. DataRequestor makes this process absolutely trivial, and enables quite a bit more functionality with minimal effort.

    var req = new DataRequestor();
    req.setObjToReplace('objID');
    req.getURL('/path/to/my/file.php');

Those three lines build an `XMLHtmlRequest` object, grab the relevant data from the server, and use that information to replace the `innerHTML` of an element with id '`objID`'. Trivial, right?

What if we wanted to do something else when the data’s loaded? Instead of replacing an element’s `innerHTML`, maybe we want to do some crazy JavaScript stuff once the data’s finished loading. Typically, this would involve being annoyed at the `XMLHttpRequest` object’s rather irritating callback structure. Happily, DataRequestor wraps this complexity in a warm blanket of event-driven goodness:

    req.onload = function (data, obj) {
        // Insert crazy JavaScript stuff here!
    }

DataRequestor is a solid, stable, and event-driven JavaScript class that you can simply drop into a page and start running with. It makes `XMLHTTPRequest`'s functionality available in a way that doesn’t make my brain hurt, and hopefully it will do the same for you.  [Download DataRequestor.js][datarequestor] and browse through the code.  It's well commented; use cases and instructions abound.

How can I get it?
-----------------

You may download the [current stable version (1.6) of DataRequestor.js **right here**][download].  How's that for convenience?