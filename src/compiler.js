/*
 * A auto-compile tool for student's homework
 */

let exec = require("child_process").exec;
let events = require("events");

let compiler = {
    "C": "gcc %source -o %exec -std=c99 -lm -Werror -Wall %flags",
    "C++14": "g++ %source -o %exec -std=c++14 -lm -Werror -Wall %flags",
    "C++17": "g++ %source -o %exec -std=c++17 -lm -Werror -Wall %flags"
};

function Compiler(language = "C++17") {
    this.language = language;
    this.sourceList = [];
    this.compileFlags = "";
    this.events = new events.EventEmitter();
}

/*
 * The routine $(route) of source is after autoCompiler/source
 */
Compiler.prototype.addSource = function(route) {
    let fullroutine = "../source/" + route;
    this.sourceList.push(fullroutine);
};

/*
 * Compile the source files to autoCompiler/bin/$(execName)
 */
Compiler.prototype.compile = function(execName) {
    let baseCommand = compiler[this.language];
    baseCommand = baseCommand.replace(/%source/, this.sourceList.join(" "));
    baseCommand = baseCommand.replace(/%exec/, "../bin/" + execName);
    baseCommand = baseCommand.replace(/%flags/, this.compileFlags);
    exec(baseCommand, (error, stdout, stderr) => {
        if(error) {
            this.events.emit("compileFinish", {"status": error.code, "stack": error.stack, "stdout": stdout, "stderr": stderr});
        } else if(stderr !== "") {
            this.events.emit("compileFinish", {"status": -1, "stack": "Compile Error", "stdout": stdout, "stderr": stderr});
        } else {
            this.events.emit("compileFinish", {"status": 0, "stack": null, "stdout": stdout, "stderr": stderr});
        }
    })
};

exports.Compiler = Compiler;