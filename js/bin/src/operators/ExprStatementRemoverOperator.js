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
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.ExpressionStatement) {
                this._nodes.push(node);
                this._meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let nodes = this._nodes.filter(value => { return super.node_id(value) === 0; });
        let metadata = this._meta.filter(value => { return super.node_id(value) === 0; });
        if (nodes.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = rand_1.Rand.range(nodes.length);
            const node = nodes[index];
            const meta = metadata[index];
            return super.cleaned_code.slice(0, meta.start.offset) +
                super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.ExprStatementRemoverOperator = ExprStatementRemoverOperator;
