/*jslint node: true */
(function () {
    "use strict";

    var util,
        setup,
        webconfig,
        sys = require("sys"),
        path = require("path"),
        fs = require("fs");

    util = {
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
            var newString = "",
                indentBy = 0,
                i,
                l = jsonstring.length;

            for (i = 0; i < l; i += 1) {
                if (jsonstring[i] === "{") {
                    indentBy += 1;
                    newString += "{\n" + util.addSpaces(indentBy);
                } else if (jsonstring[i] === "}") {
                    indentBy -= 1;
                    newString += util.addSpaces(indentBy) + "\n}";
                } else if (jsonstring[i] === "," && jsonstring[i - 1] === "\"" && jsonstring[parseInt(i + 1, 10)] === "\"") {
                    newString += ",\n" + util.addSpaces(indentBy);
                } else {
                    newString += jsonstring[i];
                }
            }

            newString = newString.replace(/((")(:)(["\d]))/g, "$2 $3 $4");

            return newString;
        }
    };

    setup = {
        webconfig : {
            load : function (data) {
                webconfig = JSON.parse(data.toString());

                process.abort();
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
            setup.webconfig.init();
        }
    };

    setup.init();

}());