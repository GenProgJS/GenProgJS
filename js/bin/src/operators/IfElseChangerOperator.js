"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const escodegen_1 = __importDefault(require("escodegen"));
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const gens_1 = require("./gens");
const lodash_1 = __importDefault(require("lodash"));
class IfElseChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._conditionals = [];
        this._conditionals_meta = [];
    }
    _init() {
        this._conditionals = [];
        this._conditionals_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let conditionals = this._conditionals.filter(value => { return super.node_id(value) === 0; });
        let conditionals_meta = this._conditionals_meta.filter(value => { return super.node_id(value) === 0; });
        if (conditionals.length > 0) {
            const patch = this._patch(conditionals, conditionals_meta);
            return patch;
        }
        return super.cleaned_code;
    }
}
class RemoveIfNodesOperator extends IfElseChangerOperator {
    _removeable_alternates(conditional) {
        let removeable = [];
        let current = conditional;
        do {
            if (Math.random() < 0.5) {
                removeable.push(current);
            }
        } while ((current = current.alternate) != null);
        return removeable;
    }
    _patch(conditionals, conditionals_meta) {
        const index = rand_1.Rand.range(conditionals.length);
        const node = conditionals[index];
        const meta = conditionals_meta[index];
        let removeables = this._removeable_alternates(node);
        let current = node;
        let build = lodash_1.default.cloneDeep(node);
        let current_build = build;
        let runs = 0;
        do {
            if (!removeables.includes(current)) {
                lodash_1.default.assign(current_build, current);
                current_build = current_build.alternate;
                ++runs;
            }
            else {
                lodash_1.default.assign(current_build, current.consequent);
            }
        } while ((current = current.alternate) != null);
        let trimmed_if;
        if (runs === 0 || build == null) {
            trimmed_if = '';
        }
        else {
            trimmed_if = gens_1.gencode(escodegen_1.default, build);
        }
        return this.cleaned_code.slice(0, meta.start.offset) +
            trimmed_if + this.cleaned_code.slice(meta.end.offset);
    }
}
exports.RemoveIfNodesOperator = RemoveIfNodesOperator;
class LastElseIfToElseOperator extends IfElseChangerOperator {
    _patch(conditionals, conditionals_meta) {
        const index = rand_1.Rand.range(conditionals.length);
        const node = conditionals[index];
        const meta = conditionals_meta[index];
        let last = node;
        while (last.alternate != null) {
            last = last.alternate;
        }
        lodash_1.default.assign(last, last.consequent);
        let trimmed_if = gens_1.gencode(escodegen_1.default, node);
        return this.cleaned_code.slice(0, meta.start.offset) +
            trimmed_if + this.cleaned_code.slice(meta.end.offset);
    }
}
exports.LastElseIfToElseOperator = LastElseIfToElseOperator;
