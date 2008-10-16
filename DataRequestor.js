/**
 *    DataRequestor Class v: 1.7 - Oct 16th, 2008
 *
 *	      Copyright 2008 - Mike West - http://mikewest.org/
 *
 *        This software is licensed under the MIT license, details of which
 *        can be found at http://github.com/mikewest/datarequestor/tree/master/LICENSE
 *
 *        This class wraps the XMLHttpRequest object with a friendly API
 *        that makes complicated data requests trivial to impliment in
 *        your application.
 *
 *        USAGE:
 *            ----
 *            BASIC
 *            To instantiate the object, simply call it as a constructor:
 *
 *                var req = new DataRequestor();
 *
 *            Once you have the object instantiated, your usage will depend
 *            on your needs.  
 *
 *			  RETURNING TEXT
 *            If you want to grab data, and shove it wholesale into an element 
 *            on the page (which I do 90% of the time), then tell the DataRequestor
 *            object where to stick the info by passing setObjToReplace an
 *            element ID or object reference, and call getURL to complete the
 *            process:
 *
 *                req.setObjToReplace('objID');
 *                req.getURL(url);
 *
 *
 *            RETURNING A DOM OBJECT
 *            By default, the contents of the requested file will be passed in as
 *            plaintext, which can be simpler to work with than a real DOM object.
 *            If you'd like a DOM object to work with, then call getURL with
 *            _RETURN_AS_DOM as the second argument:
 *
 *                req.getURL(url, _RETURN_AS_DOM);
 *
 *            To avoid irritating problems, make sure you're sending a Content-type header
 *            of "text/xml" when you'd like your data processed as a DOM object.  IE gets
 *            confused otherwise.
 *
 *            RETURNING A JSON OBJECT
 *            If you've no idea what JSON is, visit http://www.json.org/
 *
 *            To get a JavaScript object back from DataRequestor, call getURL with
 *            with _RETURN_AS_JSON as the second parameter.
 *
 *                req.getURL(url, _RETURN_AS_JSON);
 *
 *            This, of course, assumes that you've generated a JSON string correctly
 *            at the URL you've requested.
 *            ----
 *            ARGUMENTS
 *
 *            To pass in GET or POST variables along with your request, use the
 *            addArg method:
 *
 *                req.addArg(argType, argName, argValue);
 *                e.g.
 *                req.addArg(_GET, "argument_number", "1");
 *
 *            addArg will automatically call escape() on the name and value to
 *            ensure they are URL escaped correctly.
 *            
 *            ARGUMENTS FROM A FORM
 *
 *            To pass in all the arguments from a form, use the `addArgsFromForm`
 *            method.  This will automatically call `addArg` on each of the form
 *            elements using the `method` attribute of the form to set the request 
 *            method for the arguments.  Each form element *must* have an ID for this
 *            method to function correctly.
 *
 *                req.addArgsFromForm(formID);
 *                e.g.
 *                req.addArgsFromForm("myFormName");
 *            ----
 *            EVENT HANDLERS
 *
 *                ON LOAD
 *
 *                To take action when the data loads successfully, set onload to a function that
 *                takes two arguments: data, and obj.  This will be called upon successful retrieval
 *                of the requested information, and will be passed the data retrieves and the object
 *                that will be replaced (or null if no replacement has been requested).
 *
 *                    req.onload = function (data, obj) {
 *                        alert("Callback handler called with the following data: \n" + data);
 *                    }
 *
 *                The first parameter (`data`) will be one of three things:
 *                    - text:  If getURL was called without a second argument, or _RETURN_AS_TEXT,
 *                      then `data` contains the raw text returned by the page that you loaded.
 *                    
 *                    - DOM object: If getURL was called with _RETURN_AS_DOM as the second argument, then
 *						`data` contains a DOM object, with blank whitespace nodes removed in order to 
 *                      provide a consistant experience between browsers that support the DOM standard
 *                      and IE.
 *
 *                    - JavaScript object: If getURL was called with _RETURN_AS_JSON as the second argument,
 *                      then `data` contains a JavaScript object generated from the JSON text that was returned
 *                      by the page you loaded.
 *
 *                ON REPLACE
 *                
 *                If you requested a replacement by setting an `objToReplace`, then this handler will
 *                be called directly after the replacement occurs, and will be passed the same variables
 *                as the `onload` method.
 *
 *                    req.onreplace = function (data, obj) {
 *                        alert("Callback handler called with the following data: \n" + data);
 *                    }
 *
 *                ERROR HANDLING
 *
 *                If the request fails, the XMLRequestor object defaults to simply throwing
 *                an error.  If that's not a great solution for you, then assign a function
 *                to onfail that accepts a single variable: the XMLHttpRequest status
 *                code.  If the status returned is "-1", then DataRequester encountered
 *                an error it didn't know what to do with.  In this case, it will pass a
 *                second argument: the text of the thrown error.  Do with it what you will:
 *
 *                    req.onfail = function (status) {
 *                        alert("The handler died with a status of " + status);
 *                    }
 *
 *                PROGRESS
 *
 *                In Mozilla, it's possible to dynamically retrieve the amount of data that
 *                has been downloaded so far.  If you'd like to take an action on that data
 *                (e.g. set up some sort of progress bar) then set an onprogress handler that
 *                accepts two arguments, currentLength and totalLength.  Curiously enough,
 *                these arguments will be populated with the current amount of data that's been
 *                retrieved and the total size (or -1 if it can't be detected)
 *
 *                    req.onprogress = function (current, total) {
 *                        alert(current + " of " + total + " = " + ((total - current)/total) + "%");
 *                    }
 *
 */
var _RETURN_AS_JSON = 2;
var _RETURN_AS_TEXT = 1;
var _RETURN_AS_DOM  = 0;

var _POST           = 0;
var _GET            = 1;

var _CACHE           = 0;
var _NO_CACHE        = 1;

function DataRequestor() {
    var self = this;  // workaround for scope errors: see http://www.crockford.com/javascript/private.html

    /**
     *  Create XMLHttpRequest object: handles branching between
     *  versions of IE and other browers.  Inital version from:
     *  http://jibbering.com/2002/4/httprequest.html (GREAT resource)
     *
     *  later version adapted from:
     *  http://jpspan.sourceforge.net/wiki/doku.php?id=javascript:xmlhttprequest:behaviour:httpheaders
     *
     *  @return     the XMLHttpRequest object
     */
    this.getXMLHTTP = function() {
        var xmlHTTP = null;

        try {
            xmlHTTP = new XMLHttpRequest();
        } catch (e) {
            try {
                xmlHTTP = new ActiveXObject("Msxml2.XMLHTTP")
            } catch(e) {
                var success = false;
                var MSXML_XMLHTTP_PROGIDS = new Array(
                    'Microsoft.XMLHTTP',
                    'MSXML2.XMLHTTP',
                    'MSXML2.XMLHTTP.5.0',
                    'MSXML2.XMLHTTP.4.0',
                    'MSXML2.XMLHTTP.3.0'
                );
                for (var i=0;i < MSXML_XMLHTTP_PROGIDS.length && !success; i++) {
                    try {
                        xmlHTTP = new ActiveXObject(MSXML_XMLHTTP_PROGIDS[i]);
                        success = true;
                    } catch (e) {
                        xmlHTTP = null;
                    }
                }
            }

        }
        self._XML_REQ = xmlHTTP;
        return self._XML_REQ;
    }

    /**
     *   Starts the request for a url.  XMLHttpRequest will call
     *   the default callback method when the request is complete
     *   @param     url     the URL to request: absolute or relative will work
     *   @param     return  optional arg: defaults to _RETURN_AS_TEXT.  if set to _RETURN_AS_DOM, will return a DOM object instead of a string
     *   @return    true
     */
    this.getURL = function(url) {
        
        if (self.onLoad) {
            self.onload     = self.onLoad;
        }
        if (self.onReplace) {
            self.onreplace  = self.onReplace;
        }
        if (self.onProgress) {
            self.onprogress = self.onProgress;
        }
        if (self.onFail) {
            self.onfail     = self.onFail;
        }
        
        self.userModifiedData = "";  // clear user modified data;
        // DID THE USER WANT A DOM OBJECT, OR JUST THE TEXT OF THE REQUESTED DOCUMENT?
			switch (arguments[1]) {
				case _RETURN_AS_DOM:
				case _RETURN_AS_TEXT:
				case _RETURN_AS_JSON:
					self.returnType = arguments[1];
					break;
				
				default:
					self.returnType = _RETURN_AS_TEXT;
			}

		// CLEAR OUT ANY CURRENTLY ACTIVE REQUESTS
            if ((typeof self._XML_REQ.abort) != "undefined" && self._XML_REQ.readyState!=0) { // Opera can't abort().
                self._XML_REQ.abort();
            }

        // SET THE STATE CHANGE FUNCTION
            self._XML_REQ.onreadystatechange = self.callback;

        // GENERATE THE POST AND GET STRINGS
            var requestType = "GET";
            var getUrlString = (url.indexOf("?") != -1)?"&":"?";
            for (i=0;i<self.argArray[_GET].length;i++) {
                getUrlString += self.argArray[_GET][i][0] + "=" + self.argArray[_GET][i][1] + "&";
            }
            var postUrlString = "";
            for (i=0;i<self.argArray[_POST].length;i++) {
                postUrlString += self.argArray[_POST][i][0] + "=" + self.argArray[_POST][i][1] + "&";
            }
            if (postUrlString != "") {
                requestType = "POST";  // Only POST if we have post variables
            }

        // MAKE THE REQUEST
            try {
                self._XML_REQ.open(requestType, url + getUrlString, true);
    	        if ((typeof self._XML_REQ.setRequestHeader) != "undefined") { // Opera can't setRequestHeader()
                    if (self.returnType == _RETURN_AS_DOM && typeof self._XML_REQ.overrideMimeType == "function") {
                        self._XML_REQ.overrideMimeType('text/xml');  // Make sure we get XML if we're trying to process as DOM
                    }
                    self._XML_REQ.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
                }
                self._XML_REQ.send(postUrlString);
            } catch (e) {
                self.error = e;
            }
            
        if (self.error) {
            if (self.onfail) {
                self.onfail(-1, self.error);
            } else {
                throw new Error("DataRequester encountered an unexpected exception: '"+self.error+"'");
            }
        }
            
        return true;
    }
    
    

    /**
     *  The default callback method: this is called when the XMLHttpRequest object
     *  changes state.
     *  - If the readystate == 4 (done) and the status == 200 (OK), then
     *    the request was successful, and we take some action:
     *      - If the user has set an object to replace, we check to see if we recieved plaintext (default)
     *        or if the text should be run through eval first.
     *
     *          - If we recieved plaintext, we simply replace the relevant object on the page with the
     *            text we received.
     *
     *          - If we recieved text to evaluate, we call eval() on it, and then replace the object
     *            wholesale with _DOM_OBJ (which resulted from the eval) using replaceChild() on
     *            self.objToReplace's parentNode.
     *
     *      - If the user has set an onLoad method, we call it.  If they requested a DOM object, we
     *        pass it responseXML with blank text nodes stripped (to normalize between mozilla and
     *        IE.  If not, we pass them back plaintext.
     *
     *  - Else if the readystate is 3 (loading), and the user has set an onProgress handler, and
     *    we're not in IE (which has a broken readyState 3: http://jpspan.sourceforge.net/wiki/doku.php?id=javascript:xmlhttprequest:behaviour)
     *    then call it with two arguments: the current number of bytes we've downloaded, and the total size (or -1 if we can't tell).
     *
     *  - Else if the readystate is 4, and the status isn't 200 (not OK), then we failed
     *    somehow, so we either call the callbackFailure method, or throw an error.
     */
    this.callback = function() {
        var _state  = 0;
        var _status = 0;
        var _error  = "";
        try {
            _state  = self._XML_REQ.readyState;
        } catch (e) {
            _error  = e;
            _state  = 0;
        }
        
        try {
            _status = self._XML_REQ.status;
        } catch (e) {
            _error  = e;
            _status = -1;
        }
        
        if (
            (_state == 4 && _status == 200)
            ||
            (_state == 4 && _status == 0) // Locally hosted files (e.g. `file:///*`) don't have a status
           ) {
            var obj = self.getObjToReplace();
            if (self.onload) {
            	switch (self.returnType) {
            		case _RETURN_AS_TEXT:
            			// We want text back, so send responseText
	                    self.onload(self._XML_REQ.responseText, obj);
	                    break;
	                    
	                case _RETURN_AS_DOM:
	                	// We want a DOM object back, so send a normalized responseXML
	                    self.onload(self.normalizeWhitespace(self._XML_REQ.responseXML), obj);
	                    break;
	                    
	                case _RETURN_AS_JSON:
	                	// We want a javascript object back, so give it:
	                	self.onload(eval('(' + self._XML_REQ.responseText + ')'), obj);
	                	break;
            	}
            }
            if (obj) {
                // We're going to replace obj's content with the text returned from the XML_REQ.
                // The old content will be stored in self.objOldContent, the new content in 
                // self.objNewContent
                
				// We treat TEXTAREA and INPUT nodes differently (because IE crashes if you 
				// try to adjust a TEXTAREA's innerHTML).
				if (obj.nodeName == "TEXTAREA" || obj.nodeName == "INPUT") {
				    self.objOldContent = obj.value;
					obj.value          = (self.userModifiedData)?self.userModifiedData:self._XML_REQ.responseText;
					self.objNewContent = obj.value;					
				} else {
				    self.objOldContent = obj.innerHTML;
					obj.innerHTML      = (self.userModifiedData)?self.userModifiedData:self._XML_REQ.responseText;
					self.objNewContent = obj.innerHTML;					
				}
                if (self.onreplace) {
                    self.onreplace(obj, self.objOldContent, self.objNewContent);
                }
            }
        } else if (_state == 3) {
            if (self.onprogress && !document.all) { // This would throw an error in IE.
                var contentLength = 0;
                // Depends on server.  If content-length isn't set, catch the error
                try {
                    contentLength = self._XML_REQ.getResponseHeader("Content-Length");
                } catch (e) {
                    contentLength = -1;
                }
                self.onprogress(self._XML_REQ.responseText.length, contentLength);
            }

        } else if (_state == 4) {
            if (self.onfail) {
                self.onfail(_status, self.error);
            } else {
                throw new Error("DataRequester encountered an unexpected exception: '"+self.error+"'.\nThe status code is: "+_status);
            }
        }
    }


    /**
     *  Normalizes whitespace between mozilla and IE
     *    - removes blank text nodes (where "blank" is defined as "containing no non-space characters")
     *  @param  domObj    the root of the DOM object to normalize
     */
    this.normalizeWhitespace = function (domObj) {
        // with thanks to the kind folks in this thread: 
        //    http://www.codingforums.com/archive/index.php/t-7028
        if (document.createTreeWalker) {
            var filter = {
                acceptNode: function(node) {
                    if (/\S/.test(node.nodeValue)) {
                        return NodeFilter.FILTER_SKIP;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
            var treeWalker = document.createTreeWalker(domObj, NodeFilter.SHOW_TEXT, filter, true);
            while (treeWalker.nextNode()) {
                treeWalker.currentNode.parentNode.removeChild(treeWalker.currentNode);
                treeWalker.currentNode = domObj;
            }
            return domObj;
        } else {
            return domObj;
        }
    }
    
    this.commitData = function (newData) {
        self.userModifiedData = newData;
    }

    /**
     *  Sets the object to replace.  If passed a string, it sets objToReplaceID, which
     *  is evaluated at runtime.  Else, it sets objToReplace to the object reference
     *  it was passed.
     *  @param  obj             a reference to the object to replace, or the object's ID
     */
    this.setObjToReplace = function(obj) {
        if (typeof obj == "object") {
            self.objToReplace = obj;
        } else if (typeof obj == "string") {
            self.objToReplaceID = obj;

        }
    }

    /**
     *  Returns a reference to the object set by objToReplace
     */
    this.getObjToReplace = function() {
        if (self.objToReplaceID != "") {
            self.objToReplace = document.getElementById(self.objToReplaceID);
            self.objToReplaceID = "";
        }
        return self.objToReplace;
    }

    /**
     *  Adds an argument to the GET or POST strings.
     *  @param  type    _GET or _POST
     *  @param  name    the argument's name
     *  @param  value   the argument's value
     */
    this.addArg = function(type, name, value) {
        self.argArray[type].push([name, escape(value)]);
    }

    /**
     *  Clears the argument lists
     */
    this.clearArgs = function() {
        self.argArray[_POST] = new Array();
        self.argArray[_GET]  = new Array();
    }

    /**
     *  Adds all the variables from an HTML form to the GET or 
     *  POST strings, based on the `method` attribute` of the 
     *  form
     *  @param  formID  the ID of the form to be added
     */
    this.addArgsFromForm = function(formID) {
        var theForm = document.getElementById(formID);
        
        // Get form method, default to GET
        var submitMethod = (theForm.getAttribute('method').toLowerCase() == 'post')?_POST:_GET;
        
        // Get all form elements and use `addArg` to add them to the GET/POST string
        for (var i=0; i < theForm.elements.length; i++) {
            theNode = theForm.elements[i];
            switch(theNode.nodeName.toLowerCase()) {
                case "input":
                case "select":
                case "textarea":
                    this.addArg(submitMethod, theNode.id, theNode.value);
                    break;
            }
        }
    }

    /**
     *  Resets everything to defaults
     */
    this.clear = function() {
        self.returnType      = _RETURN_AS_TEXT;
        self.argArray        = new Array();

        self.objToReplace    = null;
        self.objToReplaceID  = "";

        self.onload          = null;
        self.onfail          = null;
        self.onprogress      = null;
        self.cache           = new Array();
        this.clearArgs();
    }



    // ENSURE THAT WE'VE GOT AN XMLHttpRequest OBJECT AVALIABLE
    if (!this.getXMLHTTP()) {
        throw new Error("Could not load XMLHttpRequest object");
    }

    this.clear();
}
