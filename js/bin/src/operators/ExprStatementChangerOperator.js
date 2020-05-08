"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const filters_1 = require("./filters/filters");
class ExprStatementChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._expressions = [];
        this._expressions_meta = [];
        this._buggy_expressions = [];
        this._buggy_expressions_meta = [];
    }
    _init() {
        this._expressions = [];
        this._expressions_meta = [];
        this._buggy_expressions = [];
        this._buggy_expressions_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata)) {
            if (node.type === esprima_1.Syntax.ExpressionStatement) {
                this._buggy_expressions.push(node);
                this._buggy_expressions_meta.push(metadata);
            }
        }
        else if (node.type === esprima_1.Syntax.ExpressionStatement) {
            this._expressions.push(node);
            this._expressions_meta.push(metadata);
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._buggy_expressions.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = rand_1.Rand.range(this._buggy_expressions.length);
            const node = this._buggy_expressions[index];
            const meta = this._buggy_expressions_meta[index];
            let matching_expressions, matching_expressions_meta;
            [matching_expressions, matching_expressions_meta] = filters_1.filter_expr_type(this._expressions, this._expressions_meta, node.expression.type);
            if (matching_expressions.length > 0) {
                const new_expr_index = rand_1.Rand.range(matching_expressions.length);
                const substitute = matching_expressions[new_expr_index];
                const substitute_meta = matching_expressions_meta[new_expr_index];
                const patch = super.code.slice(substitute_meta.start.offset, substitute_meta.end.offset);
                return super.code.slice(0, meta.start.offset) +
                    patch + super.code.slice(meta.end.offset);
            }
        }
        return super.code;
    }
}
exports.ExprStatementChangerOperator = ExprStatementChangerOperator;
