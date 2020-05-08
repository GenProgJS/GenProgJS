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
const BaseOperator_1 = require("./BaseOperator");
class MutationOperator extends BaseOperator_1.BaseOperator {
    constructor(code, buggy_line) {
        super();
        this._code = code;
        this._buggy_line = buggy_line;
        this._err = null;
        this._ast = null;
        if (!code || !buggy_line)
            this._err = TypeError("ERROR: undefined program or buggy_line");
        else if ((code.match(/\n/g) || '').length + 1 < buggy_line)
            this._err = RangeError("ERROR: buggy line greater, than lines in code");
        if (buggy_line <= 0)
            this._err = RangeError("WARNING: no bugs specified in code; line = " + buggy_line.toString());
        if (this._err)
            return;
        try {
            this._ast = esprima.parseScript(this._code, config.esprima);
        }
        catch (err) {
            this._err = err;
        }
    }
    _init() {
        this._ast = esprima.parseScript(this._code, config.esprima, this._operator.bind(this));
    }
}
exports.MutationOperator = MutationOperator;
