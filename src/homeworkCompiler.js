/*
 * Auto-compiler for homework format
 */

let Compiler = require("./compiler.js").Compiler;
let events = require("events");
let fs = require("fs");
let path = require("path");

let extname = {
    "C": ".c",
    "C++14": ".cpp",
    "C++17": ".cpp"
};
let parser = /.*_[A-Z][a-z]+[A-Z]*_s\d+_hw[4-8].*.[c|C].*/;

let compileEvent = new events.EventEmitter();
function compile(lang) {
    fs.readdir('../source/', function(err, files) {
        if(err) {
            console.log(err);
        } else {
            let dataJson = []; // All data for homework files
            let compilationJobCnt = 0;
            let fioJobCnt = 0;

            files.forEach(function(filename) {
                let curId = dataJson.length;
                dataJson.push({source: filename, bin: "", errorMsg: ""});

                if(path.extname(filename).toLowerCase() !== extname[lang]) {
                    dataJson[curId].errorMsg = "Wrong Extension Name! ";
                    return;
                }
                if(!parser.exec(filename)) dataJson[curId].errorMsg = "Bad File Name!";

                let fullFilename = "../source/" + filename;
                let comp = new Compiler(lang);
                comp.addSource(fullFilename);
                compilationJobCnt++;
                comp.compile("../bin/" + path.basename(filename, path.extname(filename)));
                comp.events.on("compileFinish", function(arg) {
                    if(arg.status !== 0) {
                        if(arg.stderr) {
                            fioJobCnt++;
                            fs.writeFile("../bin/" + filename + ".compile.log", arg.stderr, () => {
                                fioJobCnt--;
                                compileEvent.emit("checkStatus", [compilationJobCnt, fioJobCnt, dataJson]);
                            });
                            dataJson[curId].errorMsg += arg.stderr;
                        } else {
                            fioJobCnt++;
                            fs.writeFile("../bin/" + filename + ".compile.log", arg.stack, () => {
                                fioJobCnt--;
                                compileEvent.emit("checkStatus", [compilationJobCnt, fioJobCnt, dataJson]);});
                            dataJson[curId].errorMsg += arg.stack;
                        }
                    } else {
                        dataJson[curId].bin = "../bin/" + path.basename(filename, path.extname(filename));
                    }

                    compilationJobCnt--;
                    compileEvent.emit("checkStatus", [compilationJobCnt, fioJobCnt, dataJson]);
                });
            });

            compileEvent.on("checkStatus", (args) => {
                let compilationJobCnt = args[0];
                let fioJobCnt = args[1];
                let dataJson = args[2];
                if((compilationJobCnt === 0) && (fioJobCnt === 0)) {
                    fs.writeFile("../data/compile.json", JSON.stringify(dataJson), () => {
                        compileEvent.emit("batchFinish");
                    });
                }
            });
        }
    });
}

exports.compile = compile;
exports.compileEvent = compileEvent;