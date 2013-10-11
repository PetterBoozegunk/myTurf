﻿/*jslint node: true */
(function () {
    "use strict";

    var files,
        util,
        setup,
        webconfig,
        server,
        sys = require("sys"),
        path = require("path"),
        fs = require("fs"),
        http = require("http");

    util = {
        trim : function (str) {
            return str.toString().replace(/(^\s+|\s+$)/g, "");
        },
        addSpaces : function (indentBy) {
            var spaces = "    ",
                spaceString = "",
                i,
                l = indentBy;

            for (i = 0; i < l; i += 1) {
                spaceString += spaces;
            }

            return spaceString;
        },
        indentJSON : function (jsonstring) {
            var trimString = util.trim(jsonstring),
                newString = "",
                indentBy = 0,
                i,
                l = trimString.length;

            for (i = 0; i < l; i += 1) {
                if ((/[\{\[]/).test(trimString[i])) { // start (object || array)
                    indentBy += 1;
                    newString += trimString[i] + "\n" + util.addSpaces(indentBy);
                } else if ((/[\}\]]/).test(trimString[i])) { // end (object || array)
                    indentBy -= 1;
                    newString += "\n" + util.addSpaces(indentBy) + trimString[i];
                } else if (trimString[i] === ",") {
                    newString += ",\n" + util.addSpaces(indentBy);
                } else {
                    newString += trimString[i];
                }
            }

            newString = newString.replace(/((")(:)(["\d\{\[]))/g, "$2 $3 $4");

            return newString;
        },
        getTagName : function (trimString, i) {
            var j,
                k,
                l = trimString.length,
                tagName = "";

            for (j = i; i > -1; j -= 1) {
                if ((/</).test(trimString[j])) {
                    j = parseInt(j + 1, 10);
                    break;
                }
            }

            for (k = j; k < l; k += 1) {
                if ((/(\s|>|\/)/).test(trimString[k])) {
                    break;
                } else {
                    tagName += trimString[k];
                }

            }

            return tagName;
        },
        indentHTML : function (htmlString) {
            var trimString = util.trim(htmlString),
                tagName,
                newString = "",
                indentBy = 0,
                i,
                l = trimString.length;

            for (i = 0; i < l; i += 1) {
                if ((/>/).test(trimString[i])) { // tag end

                    tagName = util.getTagName(trimString, i);

                    if (!tagName || (tagName && !(/^(meta)$/i).test(tagName))) {
                        indentBy += 1;
                    }

                    newString += trimString[i] + "\n" + util.addSpaces(indentBy);
                } else if (trimString[Math.round(i + 1)] && (/</).test(trimString[i]) && (/\//).test(trimString[Math.round(i + 1)])) { // start endtag
                    indentBy -= 1;
                    newString += "\n" + util.addSpaces(indentBy) + trimString[i];

                    if (indentBy > 0) {
                        indentBy -= 1;
                    }

                    newString = newString.replace(/(\n)(\s+)(\n)/g, "$1");
                } else {
                    newString += trimString[i];
                }
            }

            return newString;
        }
    };

    files = {
        pages : {
            "404" : {
                "title" : "404",
                "h1" : "404"
            },
            "500" : {
                "title" : "500",
                "h1" : "500"
            }
        },
        types : {
            "html" : {
                doctype : "<!DOCTYPE html>\n",
                doc : "<html><head><meta charset=\"utf-8\"><title>[title]</title></head><body><h1>[h1]</h1></body></html>"
            }
        },
//        write : function (error) {
//            if (error) {
//                throw error;
//            }
//        },
        createHTML : function (fileName) {
            var options = {
                    encoding: "utf8"
                },
                html = files.types.html,
                fileString = html.doc;

            fileString = fileString.replace(/\[title\]/, files.pages[fileName].title);
            fileString = fileString.replace(/\[h1\]/, files.pages[fileName].h1);

            fileString = html.doctype + util.indentHTML(fileString);

//            fs.writeFile(fileName + ".html", fileString, options, files.write);
            fs.writeFile(fileName + ".html", fileString, options, function (error) {
                if (error) {
                    throw error;
                }

                sys.puts(fileName + ".html was created");
            });
        },
        handleExistsError : function (error) {
            var fileNameArray,
                fileName;

            if (error && (error.code === "ENOENT")) {
                fileNameArray = error.path.match(/\w+\.html$/);
                fileName = fileNameArray[0].replace(/\.html$/, "");

                files.createHTML(fileName);
            }
        },
        exists : function (fileName) {
            var filePath = path.join(process.cwd(), fileName + ".html");

            fs.readFile(filePath, files.handleExistsError);
        },
        create : function () {
            var k,
                pages = files.pages;

            for (k in pages) {
                if (pages.hasOwnProperty(k)) {
                    files.exists(k);
                }
            }
        }
    };

    server = {
        create : function (request, response) {
            console.log(request + "\n" + response);
        },
        addListener : function (webConfig) {
            http.createServer(server.create).listen(webConfig.port, webConfig.hostname);

            sys.puts("Server Running on http://" + webConfig.hostname + ":" + webConfig.port);
        }
    };

    setup = {
        files : {
            init : files.create
        },
        webconfig : {
            load : function (data) {
                webconfig = JSON.parse(data.toString());

                server.addListener(webconfig);
            },
            write : function (error) {
                if (error) {
                    throw error;
                }

                sys.puts("webconfig.json was created");
                setup.webconfig.init();
            },
            create : function (data) {
                var options = {
                        encoding: "utf8"
                    },
                    dataStr = data.replace(/[\n\r]/g, ""),
                    hostname = dataStr.split(":")[0] || "localhost",
                    port = dataStr.split(":")[1] || 80,
                    webconfigStr = '{"hostname":"' + hostname + '","port":' + port + '}',
                    fileString = util.indentJSON(webconfigStr);

                fs.writeFile("webconfig.json", fileString, options, setup.webconfig.write);
            },
            setNameAndPort : function () {
                sys.puts("Choose the name and port for the server. ex: development.local:333 or punk.rock:666");
                sys.puts("Or hit enter/return to use \"localhost:80\"");
                process.stdin.resume();
                process.stdin.setEncoding("utf8");

                process.stdin.on("data", setup.webconfig.create);
            },
            handleInitResponseError : function (error) {
                throw error;
            },
            handleInitResponse : function (error, data) {
                var errorHandler;

                if (error) {
                    errorHandler = (error.code === "ENOENT") ? setup.webconfig.setNameAndPort : setup.webconfig.handleInitResponseError;
                    errorHandler(error);
                } else {
                    setup.webconfig.load(data);
                }
            },
            init : function () {
                var webconfigPath = path.join(process.cwd(), "webconfig.json");

                fs.readFile(webconfigPath, setup.webconfig.handleInitResponse);
            }
        },
        init : function () {
            setup.files.init();
            setup.webconfig.init();
        }
    };

    setup.init();

}());