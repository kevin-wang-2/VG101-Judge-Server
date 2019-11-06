/*
 * A batch grader for homework
 */

let Grader = require("./autoGrader.js").Grader;
let fs = require("fs");
let events = require("events");
let path = require("path");

let gradeEvent = new events.EventEmitter();
function grade(testcaseList, method = "IO") {
    fs.readFile("../data/compile.json", (err, data) => {
        if(err) {
            console.error(err);
        } else {
            let compileData = JSON.parse(data.toString());
            let gradeData = [];

            let execJobCnt = 0;

            fs.readFile("../testcase/" + testcaseList, (err, data) => {
                for (let i = 0; i < compileData.length; i++) {
                    console.log(compileData[i].studentID);
                    let curId = gradeData.length;
                    gradeData.push({studentID: compileData[i].studentID, grade: 0, details: []});

                    if (compileData[i].errorMsg) {
                        gradeData[curId].details = [{status: "CE", msg: compileData[i].errorMsg}];
                        fs.writeFile("../data/grade.json", JSON.stringify(gradeData), () => {
                        });
                        continue;
                    }

                    execJobCnt++;

                    let curGrader = new Grader(method);
                    curGrader.setBinaryFile(compileData[i], () => {
                        curGrader.loadTestcaseList(data, () => {
                            console.log("testpoint");
                            curGrader.events.on("testFinish", () => {
                                gradeData[curId].grade = curGrader.acCount / curGrader.testcaseCnt * 100;
                                gradeData[curId].details = curGrader.execRecord;
                                execJobCnt--;
                                console.log("Job:" + execJobCnt.toString());
                                fs.writeFile("../data/grade.json", JSON.stringify(gradeData), () => {
                                    if (execJobCnt === 0) {
                                        gradeEvent.emit("gradeFinish");
                                    }
                                })
                            });
                            curGrader.startGrading();
                        });
                    });
                }
            });
        }
    });
}

exports.grade = grade;
exports.gradeEvent = gradeEvent;