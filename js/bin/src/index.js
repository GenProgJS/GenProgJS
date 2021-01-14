"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./runner/index");
if (process.argv[2].toLowerCase() === "all") {
    index_1.run_all();
}
else {
    const operator = index_1.ops(process.argv[2]);
    if (!operator) {
        throw Error("Can't find operator: " + process.argv[2]);
    }
    index_1.run_operator(operator);
}
