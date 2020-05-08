"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class ExprStatementRemoverOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._nodes = [];
        this._meta = [];
    }
    _init() {
        this._nodes = [];
        this._meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata)) {
            if (node.type === esprima_1.Syntax.ExpressionStatement) {
                this._nodes.push(node);
                this._meta.push(metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._nodes.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = rand_1.Rand.range(this._nodes.length);
            const node = this._nodes[index];
            const meta = this._meta[index];
            return super.code.slice(0, meta.start.offset) +
                super.code.slice(meta.end.offset);
        }
        return super.code;
    }
}
exports.ExprStatementRemoverOperator = ExprStatementRemoverOperator;
