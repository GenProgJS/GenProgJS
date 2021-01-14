"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const mutations = new Set([
    "===", "!==",
    "<=", ">=",
    "!=", "==",
    "<", ">"
]);
class ConditionalBinaryOperatorChanger extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._binaries = [];
        this._binaries_meta = [];
    }
    _init() {
        this._binaries = [];
        this._binaries_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            // filter for BinaryExpressions,
            // this does NOT include LogicalExpressions like && and ||
            if (node.type === esprima_1.Syntax.BinaryExpression) {
                // if replaceable operator is in the list
                if (mutations.has(node.operator)) {
                    this._binaries.push(node);
                    this._binaries_meta.push(metadata);
                    this.stash(node, metadata);
                }
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let binaries = this._binaries.filter(value => { return super.node_id(value) === 0; });
        let binaries_meta = this._binaries_meta.filter(value => { return super.node_id(value) === 0; });
        if (binaries.length > 0) {
            const mut_values = Array.from(mutations.values());
            let patch = mut_values[rand_1.Rand.range(mut_values.length)];
            const index = rand_1.Rand.range(binaries.length);
            const node = binaries[index];
            const meta = binaries_meta[index];
            const binexpr = super.cleaned_code.slice(meta.start.offset, meta.end.offset);
            patch = binexpr.replace(node.operator.toString(), patch);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.ConditionalBinaryOperatorChanger = ConditionalBinaryOperatorChanger;
