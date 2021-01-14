import readline from "readline"
import fs from "fs";
//import { operators as ops_t} from "../operators/info/ops.json";
import { ops } from "../operators/info/ops";
import { MutationOperatorConstructible, CrossoverOperatorConstructible, BaseOperator, Operator } from "../operators/base/BaseOperator";
import { MutationOperator } from "../operators/base/MutationOperator";
import { CrossoverOperator } from "../operators/base/CrossoverOperator";
import { ArgParser } from "../argparser/ArgParser";
import path from "path";

export { ops };


export function run_operator(operatorClass: MutationOperatorConstructible | CrossoverOperatorConstructible) {
    if (process.argv.length !== 4) return;

    const filename = process.argv[3];

    if (!path.isAbsolute(filename)) {
        throw Error("File path must be absolute!\n    >>>File: " + filename);
    }
    const basename = path.basename(filename, path.extname(filename));
    const out_file = path.dirname(filename) + path.sep + basename + ".potential";

    const readInterface = readline.createInterface({
        input: fs.createReadStream(filename)
    });

    let cwd = process.cwd();

    let index = -1;
    // read up to 2 arguments
    let parents = new Array<string>();
    readInterface.on('line', function(line) {

        if (index === -1) {
            index = parseInt(line);
        }
        else {
            const source_code = ArgParser.decode_src(line);
            // the wannabe operator holder
            let operator: Operator | undefined;

            // the passed operator class's prototype is a MutationOperator
            // instance, create a MutationOperatorConstructible object
            if (operatorClass.prototype instanceof MutationOperator) {
                const cls = operatorClass as MutationOperatorConstructible
                operator = new cls(source_code, index);
            }
            // the passed operator class's prototype is a CrossoverOperator
            // instance, create a CrossoverOperatorConstructible object
            else if (operatorClass.prototype instanceof CrossoverOperator) {
                parents.push(source_code);
                
                // when we have enough parents, create the object
                if (parents.length == 2) {
                    const cls = operatorClass as CrossoverOperatorConstructible
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

function write_code_to_file(operator: Operator, out_file: string) {
    fs.appendFile(out_file, operator.err !== null ?
        "error::" + operator.constructor.name + "::" + operator.err + '\n' :
        ArgParser.encode_src(operator.code) + '\n', function (err) {
            if (err) throw err;
        });
}

export function run_all(): void {
    let runs = 0;

    for (const key in ops) {
        const op_class = ops(key);

        if (op_class !== undefined) {
            run_operator(op_class);
            ++runs;
        }
    }
}
