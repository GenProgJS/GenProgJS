"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const binary_operators = [
    "===", "!==",
    "==", "!=",
    "<", ">", "<=", ">=",
    "&&", "||",
    "+", "-", "*", "/", "**", "%",
    "|", "&", "^", "~",
    "<<", ">>", ">>>"
];
class BinaryOperatorChanger extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._buggy_bin_ops = [];
        this._buggy_bin_ops_meta = [];
    }
    _init() {
        this._buggy_bin_ops = [];
        this._buggy_bin_ops_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (node.type === esprima_1.Syntax.BinaryExpression ||
            node.type === esprima_1.Syntax.LogicalExpression) {
            if (this.is_buggy_line(metadata, false)) {
                this._buggy_bin_ops.push(node);
                this._buggy_bin_ops_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        this._buggy_bin_ops = this._buggy_bin_ops.filter(value => { return super.node_id(value) === 0; });
        this._buggy_bin_ops_meta = this._buggy_bin_ops_meta.filter(value => { return super.node_id(value) === 0; });
        if (this._buggy_bin_ops.length > 0) {
            const index = rand_1.Rand.range(this._buggy_bin_ops.length);
            const buggy = this._buggy_bin_ops[index];
            const meta = this._buggy_bin_ops_meta[index];
            const repl = binary_operators[rand_1.Rand.range(binary_operators.length)];
            let patch = super.cleaned_code.slice(meta.start.offset, meta.end.offset);
            patch = patch.replace(buggy.operator, repl);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.BinaryOperatorChanger = BinaryOperatorChanger;
