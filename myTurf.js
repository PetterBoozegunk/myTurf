/*jslint node: true */
(function () {
    "use strict";

    var file,
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
        indentHTML : function (htmlString) {
            var trimString = util.trim(htmlString),
                newString = "",
                indentBy = 0,
                i,
                l = trimString.length;

            for (i = 0; i < l; i += 1) {
                if ((/>/).test(trimString[i])) { // tag end
                    indentBy += 1;
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

    file = {
        get : function (file, property) {
            return file[file][property];
        },
        "404" : {
            "head" : "<head><title>404</title></head>",
            "body" : "<body><h1>404</h1></body>"
        },
        types : {
            "html" : {
                prestart : "<!DOCTYPE html>\n",
                start : "<html>",
                end : "</html>"
            }
        },
        write : function (error) {
            if (error) {
                throw error;
            }

            sys.puts(arguments);
        },
        create : function (fileName, fileType) {
            var options = {
                    encoding: "utf8"
                },
                type = file.types[fileType] || {
                    prestart : "",
                    start : "",
                    end : ""
                },
                fileString = type.prestart + util.indentHTML(type.start + file[fileName].head + file[fileName].body + type.end);

            fs.writeFile(fileName + "." + (fileType || "txt"), fileString, options, file.write);
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
                    webconfigStr = '{"hostname":"' + hostname + '","port":' + port + ',"defaultfile":"404.htm"}',
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
            file.create("404", "html");
            setup.webconfig.init();
        }
    };

    setup.init();

}());