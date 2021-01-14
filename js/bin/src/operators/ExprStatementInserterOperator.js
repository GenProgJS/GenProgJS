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
        if (node.type === esprima_1.Syntax.ExpressionStatement) {
            if (this.is_buggy_line(metadata, false)) {
                this._buggy_statements.push(node);
                this._buggy_statements_meta.push(metadata);
            }
            this._statements.push(node);
            this._statements_meta.push(metadata);
            this.stash(node, metadata);
        }
    }
    _generate_patch() {
        var _a;
        if (this._err !== null)
            return super.cleaned_code;
        let buggy_statements = this._buggy_statements.filter(value => { return super.node_id(value) === 0; });
        let buggy_statements_meta = this._buggy_statements_meta.filter(value => { return super.node_id(value) === 0; });
        if (buggy_statements.length > 0 && this._statements.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = rand_1.Rand.range(buggy_statements.length);
            const node = buggy_statements[index];
            const meta = buggy_statements_meta[index];
            [this._statements, this._statements_meta] = filters.remove_duplicates(this._statements, this._statements_meta);
            let insertion, insertion_meta;
            [insertion, insertion_meta] = filters.filter_by_offset(this._statements, this._statements_meta, meta, config.left_offset_threshold, config.right_offset_threshold);
            if (insertion.length > 0) {
                // before/after boolean - before = true, after = false
                const befter = Math.random() < 0.5;
                const ins_index = rand_1.Rand.range(insertion.length);
                insertion = insertion[ins_index];
                insertion_meta = insertion_meta[ins_index];
                const indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
                const patch = super.node_code(insertion);
                if (befter) {
                    return super.cleaned_code.slice(0, meta.start.offset) +
                        patch + '\n' + ' '.repeat(indent) + super.code.slice(meta.start.offset);
                }
                else {
                    return super.cleaned_code.slice(0, meta.end.offset) +
                        '\n' + ' '.repeat(indent) + patch + super.code.slice(meta.end.offset);
                }
            }
        }
        return super.cleaned_code;
    }
}
exports.ExprStatementInserterOperator = ExprStatementInserterOperator;
