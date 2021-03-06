"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class EvalMutationOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._entries = [];
        this._entries_meta = [];
        this._evals = [];
        this._evals_meta = [];
    }
    _init() {
        this._entries = [];
        this._entries_meta = [];
        this._evals = [];
        this._evals_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        this._entries.push(node);
        this._entries_meta.push(metadata);
        this.stash(node, metadata);
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.CallExpression && this.node_code(node.callee) === "eval") {
                this._evals.push(node);
                this._evals_meta.push(metadata);
            }
        }
    }
    _generate_patch() {
        var _a, _b, _c;
        if (this._err !== null)
            return super.cleaned_code;
        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });
        let evals = this._evals.filter(value => { return super.node_id(value) === 0; });
        let evals_meta = this._evals_meta.filter(value => { return super.node_id(value) === 0; });
        if (evals.length > 0) {
            const index = rand_1.Rand.range(evals.length);
            const node = evals[index];
            const meta = evals_meta[index];
            if (node.arguments[0].type === esprima_1.Syntax.Literal) {
                return this.node_code(node.arguments[0]);
            }
            try {
                let inner;
                const call_arg = this.cleaned_code.substring((_a = node.callee.range) === null || _a === void 0 ? void 0 : _a[1], meta.end.offset);
                const stringified_arg = "new String" + call_arg;
                const result = "eval(inner=" + stringified_arg + ")";
                const code = this.cleaned_code.slice(0, meta.start.offset) +
                    result + this.cleaned_code.slice(meta.end.offset);
                let eval_this = code + "\ninner;";
                let eval_code = (_b = eval(eval_this)) === null || _b === void 0 ? void 0 : _b.toString();
                // this means that the evaluation does not reach the specified eval() command
                // we will try to get the eval() function to work in the global scope
                if (eval_code === undefined || inner === undefined) {
                    eval_this = code + "\neval(" + stringified_arg + ");";
                    eval_code = (_c = eval(eval_this)) === null || _c === void 0 ? void 0 : _c.toString();
                }
                return eval_code;
            }
            catch (err) {
                this._err = err;
            }
        }
        return super.cleaned_code;
    }
}
exports.EvalMutationOperator = EvalMutationOperator;
