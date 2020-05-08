"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class ConditionalChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._conditionals = [];
        this._conditionals_meta = [];
        this._test_range = [];
    }
    _init() {
        this._conditionals = [];
        this._conditionals_meta = [];
        this._test_range = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);
                this._test_range.push(node.test.range);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._conditionals.length > 0) {
            const patch = Math.random() < 0.5 ? "false" : "true";
            const if_index = rand_1.Rand.range(this._test_range.length);
            const range_inf = this._test_range[if_index];
            return super.code.slice(0, range_inf[0]) +
                patch + super.code.slice(range_inf[1]);
        }
        return super.code;
    }
}
exports.ConditionalChangerOperator = ConditionalChangerOperator;
