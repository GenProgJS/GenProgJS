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
class ExprStatementInserterOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._statements = [];
        this._statements_meta = [];
        this._buggy_statements = [];
        this._buggy_statements_meta = [];
    }
    _init() {
        this._buggy_statements = [];
        this._buggy_statements_meta = [];
        this._statements = [];
        this._statements_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata)) {
            if (node.type === esprima_1.Syntax.ExpressionStatement) {
                this._buggy_statements.push(node);
                this._buggy_statements_meta.push(metadata);
            }
        }
        else {
            if (node.type === esprima_1.Syntax.ExpressionStatement) {
                this._statements.push(node);
                this._statements_meta.push(metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._buggy_statements.length > 0 && this._statements.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = rand_1.Rand.range(this._buggy_statements.length);
            const node = this._buggy_statements[index];
            const meta = this._buggy_statements_meta[index];
            let insertion, insertion_meta;
            [insertion, insertion_meta] = filters.filter_by_offset(this._statements, this._statements_meta, meta, config.left_offset_threshold, config.right_offset_threshold);
            if (insertion.length > 0) {
                // before/after boolean - before = true, after = false
                const befter = Math.random() < 0.5;
                const ins_index = rand_1.Rand.range(insertion.length);
                insertion = insertion[ins_index];
                insertion_meta = insertion_meta[ins_index];
                const patch = super.code.slice(insertion_meta.start.offset, insertion_meta.end.offset);
                if (befter) {
                    return super.code.slice(0, meta.start.offset) +
                        patch + '\n' + super.code.slice(meta.start.offset);
                }
                else {
                    return super.code.slice(0, meta.end.offset) +
                        '\n' + patch + super.code.slice(meta.end.offset);
                }
            }
        }
        return super.code;
    }
}
exports.ExprStatementInserterOperator = ExprStatementInserterOperator;
