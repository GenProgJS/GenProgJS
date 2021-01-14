"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class UpdateExpressionChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._updates = [];
        this._updates_meta = [];
    }
    _init() {
        this._updates = [];
        this._updates_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (node.type === esprima_1.Syntax.UpdateExpression) {
            if (this.is_buggy_line(metadata, false)) {
                this._updates.push(node);
                this._updates_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        var _a, _b;
        if (this._err !== null)
            return super.cleaned_code;
        let updates = this._updates.filter(value => { return super.node_id(value) === 0; });
        let updates_meta = this._updates_meta.filter(value => { return super.node_id(value) === 0; });
        if (updates.length > 0) {
            const index = rand_1.Rand.range(updates.length);
            const buggy = updates[index];
            const meta = updates_meta[index];
            const argument = super.cleaned_code.substring((_a = buggy.argument.range) === null || _a === void 0 ? void 0 : _a[0], (_b = buggy.argument.range) === null || _b === void 0 ? void 0 : _b[1]);
            const operator = buggy.operator === "++" ? "--" : "++";
            let patch = argument + operator;
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.UpdateExpressionChangerOperator = UpdateExpressionChangerOperator;
