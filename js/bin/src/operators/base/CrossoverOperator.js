"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima = __importStar(require("esprima"));
const lodash_1 = __importDefault(require("lodash"));
const config = __importStar(require("../config/config.json"));
const BaseOperator_1 = require("./BaseOperator");
class CrossoverOperator extends BaseOperator_1.BaseOperator {
    constructor(code1, code2, buggy_line) {
        super();
        this._code = code1;
        this._buggy_line = buggy_line;
        this._err = null;
        this._ast = null;
        this._ast1 = null;
        this._ast2 = null;
        this._code1 = code1;
        this._code2 = code2;
        this._n_op = 0;
        if (!code1 || !code2 || !buggy_line)
            this._err = TypeError("ERROR: at least one program is undefined or buggy_line not specified");
        else if ((code1.match(/\n/g) || '').length + 1 < buggy_line || (code2.match(/\n/g) || '').length + 1 < buggy_line)
            this._err = RangeError("ERROR: buggy line greater, than lines in code");
        if (buggy_line <= 0)
            this._err = RangeError("WARNING: no bugs specified in code; line = " + buggy_line.toString());
        if (this._err)
            return;
        try {
            this._ast1 = esprima.parseScript(code1, config.esprima);
            this._ast2 = esprima.parseScript(code2, config.esprima);
            this._ast = lodash_1.default.cloneDeep(this._ast1);
        }
        catch (err) {
            this._err = err;
        }
    }
    _init() {
        this._n_op = 0;
        this._ast1 = esprima.parseScript(this._code1, config.esprima, this._operator.bind(this));
        this._n_op = 1;
        this._ast2 = esprima.parseScript(this._code2, config.esprima, this._operator.bind(this));
    }
    get n() {
        return this._n_op;
    }
}
exports.CrossoverOperator = CrossoverOperator;
