"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const check_condition = (node) => node.type === esprima_1.Syntax.IfStatement ||
    node.type === esprima_1.Syntax.ForStatement ||
    node.type === esprima_1.Syntax.ForInStatement ||
    node.type === esprima_1.Syntax.ForOfStatement ||
    node.type === esprima_1.Syntax.ThrowStatement ||
    node.type === esprima_1.Syntax.WhileStatement ||
    node.type === esprima_1.Syntax.DoWhileStatement ||
    node.type === esprima_1.Syntax.SwitchStatement ||
    node.type === esprima_1.Syntax.ReturnStatement ||
    node.type === esprima_1.Syntax.ExpressionStatement;
class TryCatcherOperator extends MutationOperator_1.MutationOperator {
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
            if (check_condition(node)) {
                this._entries.push(node);
                this._entries_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        var _a;
        if (this._err !== null)
            return super.cleaned_code;
        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });
        if (entries.length > 0) {
            const index = rand_1.Rand.range(entries.length);
            const node = entries[index];
            const meta = entries_meta[index];
            let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
            if (indent === null || indent === undefined)
                indent = 0;
            // get proper indetation for code
            let node_code_lines = this.node_code(node).split('\n');
            node_code_lines.forEach((value, index) => {
                node_code_lines[index] = ' '.repeat(indent + 4) + value;
            });
            let node_code = node_code_lines.join('\n');
            const patch = "try {\n" +
                ' '.repeat(indent) + node_code + "\n" +
                ' '.repeat(indent) + "}\n" +
                ' '.repeat(indent) + "catch (err) {\n" +
                ' '.repeat(indent + 4) + "console.log('GenprogJS generated, automatic error catch :: ' + err);\n" +
                ' '.repeat(indent) + "}\n";
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.TryCatcherOperator = TryCatcherOperator;
