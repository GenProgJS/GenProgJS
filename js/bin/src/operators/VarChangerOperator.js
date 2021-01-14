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
class VarChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._entries = [];
        this._entries_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        this._calls = [];
        this._calls_meta = [];
    }
    _init() {
        this._entries = [];
        this._entries_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        this._calls = [];
        this._calls_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        const cond = node.type === esprima_1.Syntax.Identifier ||
            node.type === esprima_1.Syntax.MemberExpression ||
            node.type === esprima_1.Syntax.CallExpression;
        // save every variable name
        if (node.type === esprima_1.Syntax.MemberExpression) {
            this._members.push(node);
            this._members_meta.push(metadata);
        }
        else if (node.type === esprima_1.Syntax.Identifier) {
            this._idents.push(node);
            this._idents_meta.push(metadata);
        }
        else if (node.type === esprima_1.Syntax.CallExpression) {
            this._calls.push(node);
            this._calls_meta.push(metadata);
        }
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.Identifier ||
                node.type === esprima_1.Syntax.MemberExpression ||
                node.type === esprima_1.Syntax.CallExpression) {
                this._entries.push(node);
                this._entries_meta.push(metadata);
            }
        }
        if (cond)
            this.stash(node, metadata);
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        // select a member to change in code
        let entries = [], entries_meta = [];
        [entries, entries_meta] = filters.filter_expr_type(this._entries, this._entries_meta, [esprima_1.Syntax.Identifier, esprima_1.Syntax.MemberExpression]);
        entries = entries.filter(value => { return super.node_id(value) === 0; });
        entries_meta = entries_meta.filter(value => { return super.node_id(value) === 0; });
        if (entries.length > 0 && (this._members.length > 0 || this._idents.length > 0)) {
            let everyone = [];
            let everyone_meta = [];
            everyone = everyone.concat(this._idents).concat(this._members).concat(this._calls);
            everyone_meta = everyone_meta.concat(this._idents_meta).concat(this._members_meta).concat(this._calls_meta);
            let change_index = rand_1.Rand.range(entries.length);
            const selected_entry = entries[change_index];
            const selected_entry_meta = entries_meta[change_index];
            [everyone, everyone_meta] = filters.filter_by_offset(everyone, everyone_meta, selected_entry_meta, config.left_offset_threshold, config.right_offset_threshold);
            [everyone, everyone_meta] = filters.filter_expr_type(everyone, everyone_meta, [esprima_1.Syntax.Identifier, esprima_1.Syntax.MemberExpression]);
            [everyone, everyone_meta] = filters.remove_duplicates(everyone, everyone_meta);
            if (everyone.length > 0) {
                const substitute_index = rand_1.Rand.range(everyone_meta.length);
                const substitute = everyone[substitute_index];
                const substitute_meta = everyone_meta[substitute_index];
                const patch = super.node_code(substitute);
                return super.cleaned_code.slice(0, selected_entry_meta.start.offset) +
                    patch + super.cleaned_code.slice(selected_entry_meta.end.offset);
            }
        }
        return super.cleaned_code;
    }
}
exports.VarChangerOperator = VarChangerOperator;
