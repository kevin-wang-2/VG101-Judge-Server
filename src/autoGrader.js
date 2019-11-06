/*
 * A simple auto-grader for C and C++ homework
 */

let fs = require("fs");
let events = require("events");
let cp = require("child_process");

const exec = cp.exec;

const baseCommand = "%binfile < ../testcase/%testin > ../temp/%srcfile.%testin.out";
const diffCommand = "diff ../temp/%srcfile.%testin.out  ../testcase/%testout";
const cleanCommand = "rm ../temp/%srcfile.%testin.*";

function Grader(method = "IO") {
    this.method = method;
    this.acCount = 0;
    this.execRecord = [];
    this.events = new events.EventEmitter();
}

Grader.prototype.loadTestcaseList = function (data, callback = () => {
}) {
    this.testcaseList = JSON.parse(data.toString());
    this.testcaseCnt = this.testcaseList.length;
    this.events.emit("loadTestcaseListSuccess");
    callback();
};

Grader.prototype.setBinaryFile = function (compileData, callback = () => {
}) {
    this.compileData = compileData;
    callback();
};

Grader.prototype.startGrading = function () {
    if (this.method === "IO") this.gradeByIO();
};

Grader.prototype.gradeByIO = function () {
    let curProcessCnt = 0;
    for (let i = 0; i < this.testcaseList.length; i++) {
        let curTestcase = this.testcaseList[i];

        let curBaseCommand = baseCommand.replace("%binfile", this.compileData["bin"])
            .replace("%testin", curTestcase["in"])
            .replace("%testin", curTestcase["in"])
            .replace("%srcfile", this.compileData["source"]);

        curProcessCnt++;

        exec(curBaseCommand, {timeout:0}, (err, stdout, stderr) => {
            if (err) {
                this.execRecord.push({
                    status: "RTE",
                    errno: err.code,
                    standard: curTestcase,
                    stdout: stdout,
                    stderr: stderr
                });
                let curCleanCommand = cleanCommand.replace("%testin", curTestcase["in"])
                    .replace("%srcfile", this.compileData["source"]);

                curProcessCnt--;

                exec(curCleanCommand, (error, data) => {});

                if (curProcessCnt === 0) {
                    this.events.emit("testFinish");
                }
            } else {
                let curDiffCommand = diffCommand.replace("%testin", curTestcase["in"])
                    .replace("%testout", curTestcase["out"])
                    .replace("%srcfile", this.compileData["source"]);

                exec(curDiffCommand, (error, data) => {
                    if (data) {
                        this.execRecord.push({status: "WA", standard: curTestcase, stdout: data.split("\n")});
                    } else {
                        this.execRecord.push({status: "AC"});
                        this.acCount++;
                    }
                    curProcessCnt--;

                    let curCleanCommand = cleanCommand.replace("%testin", curTestcase["in"])
                        .replace("%srcfile", this.compileData["source"]);

                    exec(curCleanCommand, (error, data) => {});

                    if (curProcessCnt === 0) {
                        this.events.emit("testFinish");
                    }
                })
            }
        });
    }
};

exports.Grader = Grader;