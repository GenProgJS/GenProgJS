"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const mutations = new Set([
    "||", "&&"
]);
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
        if (this.is_buggy_line(metadata, false)) {
            // filter for BinaryExpressions,
            // only for logical expression like && and ||
            if (node.type === esprima_1.Syntax.LogicalExpression) {
                // if replaceable operator is in the list
                if (mutations.has(node.operator)) {
                    this._logicals.push(node);
                    this._logicals_meta.push(metadata);
                    this.stash(node, metadata);
                }
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let logicals = this._logicals.filter(value => { return super.node_id(value) === 0; });
        let logicals_meta = this._logicals_meta.filter(value => { return super.node_id(value) === 0; });
        if (logicals.length > 0) {
            const mut_values = Array.from(mutations.values());
            let patch = mut_values[rand_1.Rand.range(mut_values.length)];
            const index = rand_1.Rand.range(logicals.length);
            const node = logicals[index];
            const meta = logicals_meta[index];
            const logexpr = super.cleaned_code.slice(meta.start.offset, meta.end.offset);
            patch = logexpr.replace(node.operator.toString(), patch);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.LogicalExprChangerOperator = LogicalExprChangerOperator;
