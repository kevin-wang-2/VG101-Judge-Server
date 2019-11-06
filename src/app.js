/*
 * A demonstration of this compiler tool.
 */

let autoCompiler = require("./homeworkCompiler.js");
let autoGrader = require("./homeworkGrader");
let fs = require("fs");
let express = require("express");

let app = express();

let gradeCompleteFlag = 1;

app.engine("html", require("express-art-template"));

app.get("/", (req, res) => {
    let text = "{}";
    if(gradeCompleteFlag) text = fs.readFileSync("../data/grade.json").toString();
    res.render("../../ui/index.html", {
        graded: gradeCompleteFlag,
        data: JSON.parse(text)
    });
});

app.get("/grade", (req, res) => {
    gradeCompleteFlag = 0;
    autoCompiler.compile("C");
    autoCompiler.compileEvent.on("batchFinish", () => {
        autoGrader.grade("testcase.json");
        autoGrader.gradeEvent.on("gradeFinish", () => {
            console.log("Job Finished!");
            gradeCompleteFlag = 1;
        });
    });
    res.send("Fetching...");
});

app.get(/\/view\/(.+)/, (req, res) => {
    if(!gradeCompleteFlag) {
        res.send("Fetching...");
        return;
    }
    let urlSplit = req.url.split("/");
    let text = fs.readFileSync("../data/grade.json").toString();
    let data = JSON.parse(text);
    for(let i=0;i<data.length;i++) {
        if(data[i].studentID === urlSplit[urlSplit.length - 1]) {
            res.render("../../ui/view.html", {
                data: data[i]
            });
        }
    }
});

app.get(/\/report\/(.+)/, (req, res) => {
    if(!gradeCompleteFlag) {
        res.send("Fetching...");
        return;
    }
    let urlSplit = req.url.split("/");
    let text = fs.readFileSync("../data/grade.json").toString();
    let data = JSON.parse(text);
    let report = "";
    for(let i=0;i<data.length;i++) {
        if(data[i].studentID === urlSplit[urlSplit.length - 1]) {
            let cur = data[i];
            for (let j = 0; j < cur.details.length; j++) {
                if(cur.details[j].status === "CE") {
                    report += "Compile Error!\n";
                    report += cur.details[j].msg;
                    break;
                }
                if(cur.details[j].status === "AC") {
                    report += "testcase " + (j+1).toString() + "/" + cur.details.length.toString() + ": Accepted! \n---------\n";
                } else if(cur.details[j].status === "WA") {
                    report += "testcase " + (j+1).toString() + "/" + cur.details.length.toString() + ": Wrong Answer!\n";
                    report += "Standard Input: \n";
                    report += fs.readFileSync("../testcase/" + cur.details[j].standard["in"]);
                    report += "\nStandard Output: \n";
                    report += fs.readFileSync("../testcase/" + cur.details[j].standard["out"]);
                    report += "\nDifference between your output and standard output: \n";
                    report += cur.details[j].stdout.join("\n");
                    report += "\n---------\n";
                } else if(cur.details[j].status === "RTE") {
                    report += "testcase " + (j+1).toString() + "/" + cur.details.length.toString() + ": Runtime Error (" + cur.details[j].errno.toString() + ")!\n";
                    report += cur.details[j].stderr;
                    report += "---------\n";
                }
            }
            break;
        }
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send(report);
});

app.listen(8000, () => {
   console.log("Listening port 8000...");
});