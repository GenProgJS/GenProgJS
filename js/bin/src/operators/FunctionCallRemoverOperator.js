"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class FunctionCallRemoverOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._entries = [];
        this._entries_meta = [];
    }
    _init() {
        this._entries = [];
        this._entries_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.CallExpression) {
                this._entries.push(node);
                this._entries_meta.push(metadata);
            }
            this.stash(node, metadata);
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });
        if (entries.length > 0) {
            const index = rand_1.Rand.range(entries.length);
            const node = entries[index];
            const meta = entries_meta[index];
            const callee = node.callee;
            const patch = super.node_code(callee);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.FunctionCallRemoverOperator = FunctionCallRemoverOperator;
