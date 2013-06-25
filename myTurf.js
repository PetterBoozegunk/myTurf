/*jslint node: true */
(function () {
    "use strict";

    var filedata,
        setup,
        webconfig,
        path = require("path"),
        fs = require("fs");

//    process.stdin.on("data", function (text) {
//        console.log(text.toString());
//        process.exit();
//    });

    filedata = {
        webconfig : '{\n\t"hostname" : "localhost",\n\t"port" : 80\n}'
    };

    setup = {
        webconfig : {
            load : function (data) {
                webconfig = JSON.parse(data.toString());
            },
            write : function (error) {
                if (error) {
                    throw error;
                } else {
                    console.log("webconfig.json was created");
                    setup.webconfig.init();
                }
            },
            create : function () {
                var options = {
                    encoding : "utf8"
                };

                fs.writeFile("webconfig.json", filedata.webconfig, options, setup.webconfig.write);
            },
            handleInitResponseError : function (error) {
                console.log(error);
            },
            handleInitResponse : function (error, data) {
                var errorHandler;

                if (error) {
                    errorHandler = (error.code === "ENOENT") ? setup.webconfig.create : setup.webconfig.handleInitResponseError;
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