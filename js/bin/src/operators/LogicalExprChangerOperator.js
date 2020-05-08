"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
// TODO: is this all?
const mutations = [
    "||", "&&"
];
class LogicalExprChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._logicals = [];
        this._logicals_meta = [];
    }
    _init() {
        this._logicals = [];
        this._logicals_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata)) {
            // filter for BinaryExpressions,
            // this does NOT include LogicalExpressions like && and ||
            if (node.type === esprima_1.Syntax.LogicalExpression) {
                // if replaceable operator is in the list
                if (mutations.indexOf(node.operator) >= 0) {
                    this._logicals.push(node);
                    this._logicals_meta.push(metadata);
                }
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._logicals.length > 0) {
            let patch = mutations[rand_1.Rand.range(mutations.length)];
            const index = rand_1.Rand.range(this._logicals.length);
            const node = this._logicals[index];
            const meta = this._logicals_meta[index];
            const logexpr = super.code.slice(meta.start.offset, meta.end.offset);
            patch = logexpr.replace(node.operator.toString(), patch);
            return super.code.slice(0, meta.start.offset) +
                patch + super.code.slice(meta.end.offset);
        }
        return super.code;
    }
}
exports.LogicalExprChangerOperator = LogicalExprChangerOperator;
