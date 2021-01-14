"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const escodegen_1 = __importDefault(require("escodegen"));
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const AwaitInserterOperator_1 = require("./AwaitInserterOperator");
const gens_1 = require("./gens");
class AsyncFunctionOperator extends MutationOperator_1.MutationOperator {
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
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.FunctionDeclaration && node.async) {
                this._entries.push(node);
                this._entries_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });
        if (entries.length > 0) {
            const index = rand_1.Rand.range(entries.length);
            let node = entries[index];
            let meta = entries_meta[index];
            const code_to_modify = gens_1.gencode(escodegen_1.default, node);
            const line_num = code_to_modify.split('\n').length;
            const lines_to_modify = Array.from(new Set(rand_1.Rand.generate(line_num - 2, rand_1.Rand.range, 2, line_num)));
            let patch = code_to_modify;
            for (const line of lines_to_modify) {
                let await_inserter = new AwaitInserterOperator_1.AwaitInserterOperator(patch, line);
                await_inserter.operate();
                patch = await_inserter.code;
            }
            return this.cleaned_code.slice(0, meta.start.offset) +
                patch + this._cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.AsyncFunctionOperator = AsyncFunctionOperator;
