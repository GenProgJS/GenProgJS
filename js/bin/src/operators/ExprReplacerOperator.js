"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const filters = __importStar(require("./filters/filters"));
const config = __importStar(require("./config/config.json"));
const exclude = config.expr_replacer_exclude;
class ExprReplacerOperator extends MutationOperator_1.MutationOperator {
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
        if (ExprReplacerOperator._exclude.includes(node.type))
            return;
        if (this.is_buggy_line(metadata)) {
            // filter for every type of expressions
            // excluding ExpressionStatements
            if (node.type.indexOf("Expression") > 0) {
                this._buggy_expressions.push(node);
                this._buggy_expressions_meta.push(metadata);
                this._expressions.push(node);
                this._expressions_meta.push(metadata);
            }
        }
        else if (node.type.indexOf("Expression") > 0) {
            this._expressions.push(node);
            this._expressions_meta.push(metadata);
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._buggy_expressions.length > 0) {
            const index = rand_1.Rand.range(this._buggy_expressions.length);
            const buggy = this._buggy_expressions[index];
            const meta = this._buggy_expressions_meta[index];
            let replacements, replacements_meta;
            [replacements, replacements_meta] = filters.filter_expr_type(this._expressions, this._expressions_meta, buggy.type);
            if (buggy.operator) {
                [replacements, replacements_meta] = filters.filter_by_operator_type(replacements, replacements_meta, buggy.operator);
            }
            else if (buggy.computed !== undefined) {
                [replacements, replacements_meta] = filters.filter_by_computed_member(replacements, replacements_meta, buggy.computed);
            }
            if (replacements.length > 0) {
                const repl_index = rand_1.Rand.range(replacements.length);
                const replacement = replacements[repl_index];
                const replacement_meta = replacements_meta[repl_index];
                let patch;
                // if the expression is an AssignmentExpression there will be
                // fifty-fifty chance to replace the whole expression itself,
                // or only replace the assigned value
                const replace_partial = Math.random() < 0.5;
                if (buggy.type === esprima_1.Syntax.AssignmentExpression && replace_partial) {
                    // there is 50%, too to replace the assignment operator in the original code
                    const replace_op = Math.random() < 0.5;
                    const buggy_code = super.code.slice(meta.start.offset, meta.end.offset);
                    const insert_index = buggy_code.indexOf(buggy.operator);
                    const temp = super.code.slice(replacement_meta.start.offset, replacement_meta.end.offset);
                    const pos = temp.indexOf(replacement.operator);
                    if (replace_op) {
                        patch = temp.slice(pos);
                        patch = buggy_code.substr(0, insert_index) + patch;
                    }
                    else {
                        patch = super.code.slice(replacement.right.range[0], replacement.right.range[1]);
                        return super.code.slice(0, buggy.right.range[0]) +
                            patch + super.code.slice(buggy.right.range[1]);
                    }
                }
                else {
                    patch = super.code.slice(replacement_meta.start.offset, replacement_meta.end.offset);
                }
                return super.code.slice(0, meta.start.offset) +
                    patch + super.code.slice(meta.end.offset);
            }
        }
        return super.code;
    }
}
exports.ExprReplacerOperator = ExprReplacerOperator;
ExprReplacerOperator._exclude = exclude;
