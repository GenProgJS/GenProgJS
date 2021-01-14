"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima = __importStar(require("esprima"));
const config = __importStar(require("../config/config.json"));
var PreprocessOpt;
(function (PreprocessOpt) {
    PreprocessOpt[PreprocessOpt["replace"] = 0] = "replace";
    PreprocessOpt[PreprocessOpt["remove"] = 1] = "remove";
})(PreprocessOpt = exports.PreprocessOpt || (exports.PreprocessOpt = {}));
class BaseOperator {
    constructor() {
        this._code = '';
        this._buggy_line = 0;
        this._err = null;
        this._ast = null;
    }
    operate() {
        // if there were no errors on construction
        // start parsing the code
        if (this._err === null) {
            this._init();
            // get the patched code
            const try_code = this._generate_patch();
            // see if patched code is, in fact a valid code
            // according to configurations
            try {
                this._ast = esprima.parseScript(try_code, config.esprima);
            }
            catch (err) {
                this._err = err;
            }
            // if the newly generated code was parsed successfully,
            // update the object's program code
            if (this._err === null)
                this._code = try_code;
        }
    }
    get buggy_line() { return this._buggy_line; }
    get ast() { return this._ast; }
    /**
     * @brief code - gets the patched code after a successful operation
     * @returns {string}
     */
    get code() { return BaseOperator.preprocess(this._code); }
    get err() { return this._err; }
    is_buggy_line(metadata, end_same_line = false) {
        if (end_same_line) {
            return metadata.start.line === this.buggy_line &&
                metadata.end.line === this.buggy_line;
        }
        return metadata.start.line === this.buggy_line;
    }
    static preprocess(code, opt = PreprocessOpt.remove) {
        let raw_code_lines = code.split('\n');
        let processed_lines = [];
        if (opt === PreprocessOpt.replace) {
            let replace;
            let pred;
            raw_code_lines.forEach(line => {
                if (line.trim().indexOf("___ORIGIN___:") === 0) {
                    pred = line.substring(0, line.indexOf("___ORIGIN___:"));
                    replace = pred + line.split("___ORIGIN___:")[1];
                }
                else {
                    if (replace !== undefined) {
                        processed_lines.push(replace);
                        replace = undefined;
                    }
                    else {
                        processed_lines.push(line);
                    }
                }
            });
        }
        else {
            raw_code_lines.forEach(line => {
                if (line.trim().indexOf("___ORIGIN___:") !== 0) {
                    processed_lines.push(line);
                }
            });
        }
        let processed = processed_lines.join('\n');
        return processed;
    }
}
exports.BaseOperator = BaseOperator;
