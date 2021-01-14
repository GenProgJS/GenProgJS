"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
const fs_1 = __importDefault(require("fs"));
//import { operators as ops_t} from "../operators/info/ops.json";
const ops_1 = require("../operators/info/ops");
exports.ops = ops_1.ops;
const MutationOperator_1 = require("../operators/base/MutationOperator");
const CrossoverOperator_1 = require("../operators/base/CrossoverOperator");
const ArgParser_1 = require("../argparser/ArgParser");
const path_1 = __importDefault(require("path"));
function run_operator(operatorClass) {
    if (process.argv.length !== 4)
        return;
    const filename = process.argv[3];
    if (!path_1.default.isAbsolute(filename)) {
        throw Error("File path must be absolute!\n    >>>File: " + filename);
    }
    const basename = path_1.default.basename(filename, path_1.default.extname(filename));
    const out_file = path_1.default.dirname(filename) + path_1.default.sep + basename + ".potential";
    const readInterface = readline_1.default.createInterface({
        input: fs_1.default.createReadStream(filename)
    });
    let cwd = process.cwd();
    let index = -1;
    // read up to 2 arguments
    let parents = new Array();
    readInterface.on('line', function (line) {
        if (index === -1) {
            index = parseInt(line);
        }
        else {
            const source_code = ArgParser_1.ArgParser.decode_src(line);
            // the wannabe operator holder
            let operator;
            // the passed operator class's prototype is a MutationOperator
            // instance, create a MutationOperatorConstructible object
            if (operatorClass.prototype instanceof MutationOperator_1.MutationOperator) {
                const cls = operatorClass;
                operator = new cls(source_code, index);
            }
            // the passed operator class's prototype is a CrossoverOperator
            // instance, create a CrossoverOperatorConstructible object
            else if (operatorClass.prototype instanceof CrossoverOperator_1.CrossoverOperator) {
                parents.push(source_code);
                // when we have enough parents, create the object
                if (parents.length == 2) {
                    const cls = operatorClass;
                    operator = new cls(parents[0], parents[1], index);
                }
            }
            // error
            else {
                throw TypeError("Invalid type passed as parameter.");
            }
            // if the object construction was a success, operate
            if (operator) {
                operator.operate();
                write_code_to_file(operator, out_file);
            }
        }
    });
}
exports.run_operator = run_operator;
function write_code_to_file(operator, out_file) {
    fs_1.default.appendFile(out_file, operator.err !== null ?
        "error::" + operator.constructor.name + "::" + operator.err + '\n' :
        ArgParser_1.ArgParser.encode_src(operator.code) + '\n', function (err) {
        if (err)
            throw err;
    });
}
function run_all() {
    let runs = 0;
    for (const key in ops_1.ops) {
        const op_class = ops_1.ops(key);
        if (op_class !== undefined) {
            run_operator(op_class);
            ++runs;
        }
    }
}
exports.run_all = run_all;
