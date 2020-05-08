"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
// TODO: is this all?
exports.mutations = [
    "===", "!==",
    "<=", ">=",
    "!=", "==",
    "<", ">",
    '|', '&', '^'
];
class ConditionalTypeChangerOperator extends MutationOperator_1.MutationOperator {
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
        if (this.is_buggy_line(metadata)) {
            // filter for BinaryExpressions,
            // this does NOT include LogicalExpressions like && and ||
            if (node.type === esprima_1.Syntax.BinaryExpression) {
                // if replaceable operator is in the list
                if (exports.mutations.indexOf(node.operator) >= 0) {
                    this._binaries.push(node);
                    this._binaries_meta.push(metadata);
                }
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._binaries.length > 0) {
            let patch = exports.mutations[rand_1.Rand.range(exports.mutations.length)];
            const index = rand_1.Rand.range(this._binaries.length);
            const node = this._binaries[index];
            const meta = this._binaries_meta[index];
            const binexpr = super.code.slice(meta.start.offset, meta.end.offset);
            patch = binexpr.replace(node.operator.toString(), patch);
            return super.code.slice(0, meta.start.offset) +
                patch + super.code.slice(meta.end.offset);
        }
        return super.code;
    }
}
exports.ConditionalTypeChangerOperator = ConditionalTypeChangerOperator;
