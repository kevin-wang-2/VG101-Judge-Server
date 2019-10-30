/*
 * A simple auto-grader for C and C++ homework
 */

let fs = require("fs");
let events = require("events");
let cp = require("child_process");

const exec = cp.exec;
const spawn = cp.spawn;

const baseCommand = "%binFile < ../testcases/%testin > ../temp/%binFile.%testin.out";
const diffCommand = "diff ../temp/%binFile.%testin.out  ../testcases/%testout";
const cleanCommand = "rm ../temp/%binFile.%testin.*";

function Grader(method = "IO") {
    this.method = method;
    this.execRecord = [];
    this.events = new events.EventEmitter();
}

Grader.prototype.loadTestcaseList = function(specificationFile) {
    fs.readFile("../testcase/" + specificationFile, (err, data) => {
        if(err) {
            this.events.emit("loadTestcaseListFail", {error: "fsError", errMsg: err});
        }
        this.testcaseList = JSON.parse(data.toString());
        this.events.emit("loadTestcaseListSuccess");
    });
};

Grader.prototype.setBinaryFile = function(filename) {
    fs.readFile("../data/compile.json", (err, data) => {
        if(err) {
            this.events.emit("setBinaryFileFail", {error: "fsError", errMsg: err});
        }
        let compileData = JSON.parse(data.toString());
        for(let i=0;i<compileData.length;i++) {
            if (compileData[i]["bin"] === filename) {
                if(compileData["errMsg"] === "") {
                    this.compileData = compileData[i];
                    this.events.emit("setBinaryFileSuccess", {});
                }
            }
        }
        this.events.emit("setBinaryFileSuccess", {error: "compileError"});
    });
};

Grader.prototype.setSourceFile = function(filename) {
    fs.readFile("../data/compile.json", (err, data) => {
        if(err) {
            this.events.emit("setSourceFileFail", {error: "fsError", errMsg: err});
        }
        let compileData = JSON.parse(data.toString());
        for(let i=0;i<compileData.length;i++) {
            if (compileData[i]["source"] === filename) {
                if(compileData["errMsg"] === "") {
                    this.compileData = compileData[i];
                    this.events.emit("setSourceFileSuccess", {});
                }
            }
        }
        this.events.emit("setSourceFileSuccess", {error: "compileError"});
    });
};

Grader.prototype.startGrading = function() {
    if(this.method === "IO") this.gradeByIO();
};

Grader.prototype.gradeByIO = function() {
    let curProcessCnt = 0;
    for(let i=0;i<this.testcaseList.length;i++) {
        let signal = new events.EventEmitter();
        let curTestcase = this.testcaseList[i];

        let curBaseCommand = baseCommand.replace("%binFile", this.compileData["bin"])
            .replace("%testin", curTestcase["in"]);

        let timeout = setTimeout(() => {signal.emit("finish", 1)}, 1000);

        signal.on("finish", (arg) => {
            if(arg === 1) {
                this.execRecord.push({status: "TLE"});
            } else {
                timeout.abort();
            }
        });
        curProcessCnt++;
        exec(curBaseCommand, {timeout: 1000}, (err, stdout, stderr) => {
            signal.emit("finish", 0);
            if(error) {
                if(error) {
                    this.execRecord.push({status: "RTE", errno: err.code, standard: curTestcase, stdout: stdout, stderr: stderr});
                } else {
                    let curDiffCommand = diffCommand.replace("%binFile", this.compileData["bin"]);
                    curDiffCommand = curDiffCommand.replace("%testin", curTestcase["in"])
                        .replace("%testout", curTestcase["out"]);

                    exec(curDiffCommand, (error, data) => {
                        if(data) {
                            this.execRecord.push({status: "WA", standard: curTestcase, stdout: stdout});
                        } else {
                            this.execRecord.push({status: "AC"});
                        }

                        let curCleanCommand = cleanCommand.replace("%binFile", this.compileData["bin"])
                            .replace("%testin", curTestcase["in"]);
                        exec(curCleanCommand, () => {
                            curProcessCnt--;
                            if(curProcessCnt === 0) {
                                this.events.emit("testFinish");
                            }
                        })
                    })
                }
            }
        })
    }
};

exports.Grader = Grader;