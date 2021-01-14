"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const gens_1 = require("./gens");
const escodegen_1 = __importDefault(require("escodegen"));
const lodash_1 = __importDefault(require("lodash"));
const filters_1 = require("./filters/filters");
class TernaryChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._ternaries = [];
        this._ternaries_meta = [];
    }
    _init() {
        this._ternaries = [];
        this._ternaries_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.ConditionalExpression) {
                this._ternaries.push(node);
                this._ternaries_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let ternaries = this._ternaries.filter(value => { return super.node_id(value) === 0; });
        let ternaires_meta = this._ternaries_meta.filter(value => { return super.node_id(value) === 0; });
        if (ternaries.length > 0) {
            let patch;
            let meta;
            [patch, meta] = this._default(ternaries, ternaires_meta);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
class TernaryExchangeOperator extends TernaryChangerOperator {
    _default(ternaries, ternaries_meta) {
        const index = rand_1.Rand.range(ternaries.length);
        const node = ternaries[index];
        const meta = ternaries_meta[index];
        const alternate = lodash_1.default.cloneDeep(node.alternate);
        const consequent = lodash_1.default.cloneDeep(node.consequent);
        lodash_1.default.assign(node.alternate, consequent);
        lodash_1.default.assign(node.consequent, alternate);
        let patch = gens_1.gencode(escodegen_1.default, node);
        return [patch, meta];
    }
}
exports.TernaryExchangeOperator = TernaryExchangeOperator;
class TernaryToIfElseFunctionCallOperator extends TernaryChangerOperator {
    _default(ternaries, ternaries_meta) {
        [ternaries, ternaries_meta] = filters_1.filter_lower_orders(ternaries, ternaries_meta);
        const index = rand_1.Rand.range(ternaries.length);
        const node = ternaries[index];
        const meta = ternaries_meta[index];
        const esprima = require("esprima");
        const if_elser = (node) => {
            let if_else = '';
            do {
                const test = gens_1.gencode(escodegen_1.default, node.test);
                const consequent = gens_1.gencode(escodegen_1.default, node.consequent);
                // see if consequent contains a ternary op., too
                let ast = esprima.parseScript(consequent);
                let nested_ternary = gens_1.extract(esprima_1.Syntax.ConditionalExpression).from(ast)[0];
                if_else += `if (${test}) { `;
                if (nested_ternary) {
                    if_else += if_elser(nested_ternary);
                }
                else {
                    if_else += `return ${consequent};`;
                }
                if_else += " } else ";
                node = node.alternate;
            } while (node.type === esprima_1.Syntax.ConditionalExpression);
            if_else += `{ return ${gens_1.gencode(escodegen_1.default, node)}; }`;
            return if_else;
        };
        const if_else = if_elser(node);
        let patch = `function() { ${if_else} }()`;
        return [patch, meta];
    }
}
exports.TernaryToIfElseFunctionCallOperator = TernaryToIfElseFunctionCallOperator;
