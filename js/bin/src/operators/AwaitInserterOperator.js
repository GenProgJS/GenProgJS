"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const escodegen_1 = __importDefault(require("escodegen"));
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const filters_1 = require("./filters/filters");
const lodash_1 = __importDefault(require("lodash"));
const gens_1 = require("./gens");
class AwaitInserterOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._entries = [];
        this._entries_meta = [];
        this._removeables = [];
        this._removeables_meta = [];
        this._container = [];
        this._container_meta = [];
    }
    _init() {
        this._entries = [];
        this._entries_meta = [];
        this._removeables = [];
        this._removeables_meta = [];
        this._container = [];
        this._container_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.Identifier ||
                node.type === esprima_1.Syntax.MemberExpression ||
                node.type === esprima_1.Syntax.CallExpression) {
                this._entries.push(node);
                this._entries_meta.push(metadata);
                this.stash(node, metadata);
            }
            else if (node.type === esprima_1.Syntax.VariableDeclarator) {
                this._removeables.push(node.id);
                const artifical_meta = { start: { offset: (_a = node.id.range) === null || _a === void 0 ? void 0 : _a[0] }, end: { offset: (_b = node.id.range) === null || _b === void 0 ? void 0 : _b[1] } };
                this._removeables_meta.push(artifical_meta);
                this.stash(node, artifical_meta);
            }
            else if (node.type === esprima_1.Syntax.AssignmentExpression) {
                this._removeables.push(node.left);
                const artifical_meta = { start: { offset: (_c = node.left.range) === null || _c === void 0 ? void 0 : _c[0] }, end: { offset: (_d = node.left.range) === null || _d === void 0 ? void 0 : _d[1] } };
                this._removeables_meta.push(artifical_meta);
                this.stash(node, artifical_meta);
            }
            else if (node.type === esprima_1.Syntax.AwaitExpression) {
                this._removeables.push(node.argument);
                const artifical_meta = { start: { offset: (_e = node.argument.range) === null || _e === void 0 ? void 0 : _e[0] }, end: { offset: (_f = node.argument.range) === null || _f === void 0 ? void 0 : _f[1] } };
                this._removeables_meta.push(artifical_meta);
                this.stash(node, artifical_meta);
            }
            else if (node.type === esprima_1.Syntax.FunctionDeclaration) {
                if (node.id) {
                    this._removeables.push(node.id);
                    const artifical_meta = { start: { offset: (_g = node.id.range) === null || _g === void 0 ? void 0 : _g[0] }, end: { offset: (_h = node.id.range) === null || _h === void 0 ? void 0 : _h[1] } };
                    this._removeables_meta.push(artifical_meta);
                    this.stash(node, artifical_meta);
                }
                for (const param of node.params) {
                    this._removeables.push(param);
                    const artifical_meta = { start: { offset: (_j = param.range) === null || _j === void 0 ? void 0 : _j[0] }, end: { offset: (_k = param.range) === null || _k === void 0 ? void 0 : _k[1] } };
                    this._removeables_meta.push(artifical_meta);
                    this.stash(node, artifical_meta);
                }
            }
            else {
                this._container.push(node);
                this._container_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });
        let removeables = this._removeables.filter(value => { return super.node_id(value) === 0; });
        let removeables_meta = this._removeables_meta.filter(value => { return super.node_id(value) === 0; });
        let container = this._container.filter(value => { return super.node_id(value) === 0; });
        let container_meta = this._container_meta.filter(value => { return super.node_id(value) === 0; });
        let identifiers, identifiers_meta;
        [identifiers, identifiers_meta] = filters_1.filter_type(entries, entries_meta, esprima_1.Syntax.Identifier);
        let member_expressions, member_expressions_meta;
        [member_expressions, member_expressions_meta] = filters_1.filter_type(entries, entries_meta, esprima_1.Syntax.MemberExpression);
        [identifiers, identifiers_meta] = filters_1.filter_type(entries, entries_meta, esprima_1.Syntax.Identifier);
        let calls, calls_meta;
        [calls, calls_meta] = filters_1.filter_type(entries, entries_meta, esprima_1.Syntax.CallExpression);
        let func_args = [], func_args_meta = [];
        calls.forEach((call) => {
            func_args = func_args.concat(call.arguments);
            func_args_meta = func_args_meta.concat(call.arguments.map(val => {
                var _a, _b;
                return { start: { offset: (_a = val.range) === null || _a === void 0 ? void 0 : _a[0] }, end: { offset: (_b = val.range) === null || _b === void 0 ? void 0 : _b[1] } };
            }));
        });
        [entries, entries_meta] = filters_1.filter_lower_orders(entries, entries_meta);
        entries = entries.concat(func_args);
        entries_meta = entries_meta.concat(func_args_meta);
        entries = entries.filter((val, index) => {
            const included = removeables.includes(val);
            if (included) {
                entries_meta[index] = undefined;
            }
            return !included;
        });
        entries_meta = entries_meta.filter(val => val !== undefined);
        if (entries.length > 0) {
            let true_container, true_container_meta;
            [true_container, true_container_meta] = filters_1.filter_lower_orders(container, container_meta);
            true_container = true_container[0];
            true_container_meta = true_container_meta[0];
            const indices = Array.from(new Set(rand_1.Rand.generate(entries.length, rand_1.Rand.range, entries.length)));
            for (const index of indices) {
                const node = entries[index];
                const meta = entries_meta[index];
                const new_node = {
                    argument: lodash_1.default.cloneDeep(node),
                    type: esprima_1.Syntax.AwaitExpression
                };
                lodash_1.default.assign(node, new_node);
            }
            const patch = gens_1.gencode(escodegen_1.default, true_container);
            return super.cleaned_code.slice(0, true_container_meta.start.offset) +
                patch + super.cleaned_code.slice(true_container_meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.AwaitInserterOperator = AwaitInserterOperator;
