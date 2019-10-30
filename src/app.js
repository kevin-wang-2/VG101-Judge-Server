/*
 * A demonstration of this compiler tool.
 */

let tool = require("./homeworkCompiler.js");

tool.compile("C");
tool.compileEvent.on("batchFinish", () => {
    console.log("Job finished.");
});