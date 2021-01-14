"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class ReturnNoneOperator extends MutationOperator_1.MutationOperator {
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
            if (node.type === esprima_1.Syntax.ExpressionStatement ||
                node.type === esprima_1.Syntax.BreakStatement ||
                node.type === esprima_1.Syntax.ContinueStatement ||
                node.type === esprima_1.Syntax.ReturnStatement) {
                this._nodes.push(node);
                this._meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        this._nodes = this._nodes.filter(value => { return super.node_id(value) === 0; });
        this._meta = this._meta.filter(value => { return super.node_id(value) === 0; });
        if (this._nodes.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = rand_1.Rand.range(this._nodes.length);
            const node = this._nodes[index];
            const meta = this._meta[index];
            return super.cleaned_code.slice(0, meta.start.offset) +
                "return " + this._none() + ";" + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
class ReturnNullOperator extends ReturnNoneOperator {
    _none() {
        return "null";
    }
}
exports.ReturnNullOperator = ReturnNullOperator;
class ReturnUndefinedOperator extends ReturnNoneOperator {
    _none() {
        return "undefined";
    }
}
exports.ReturnUndefinedOperator = ReturnUndefinedOperator;
