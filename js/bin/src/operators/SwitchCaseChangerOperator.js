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
class SwitchCaseChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._switch_cases = [];
        this._switch_cases_meta = [];
    }
    _init() {
        this._switch_cases = [];
        this._switch_cases_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.SwitchCase) {
                this._switch_cases.push(node);
                this._switch_cases_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
}
class SwitchCaseNonFallThroughOperator extends SwitchCaseChangerOperator {
    _ender(nodes) {
        for (let node of nodes) {
            if (node.type === esprima_1.Syntax.ReturnStatement || node.type === esprima_1.Syntax.BreakStatement) {
                return true;
            }
        }
        return false;
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let switch_cases = this._switch_cases.filter(value => { return super.node_id(value) === 0; });
        let switch_cases_meta = this._switch_cases_meta.filter(value => { return super.node_id(value) === 0; });
        if (switch_cases.length > 0) {
            let index = rand_1.Rand.range(switch_cases.length);
            let node = switch_cases[index];
            let meta = switch_cases_meta[index];
            let statements = gens_1.extract().from(node.consequent);
            let ender = this._ender(statements);
            if (!ender) {
                const patch = this._default(node, meta);
                return super.cleaned_code.slice(0, meta.end.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }
        return super.cleaned_code;
    }
}
class SwitchCaseStrictNonFallThroughOperator extends SwitchCaseNonFallThroughOperator {
    _ender(nodes) {
        if (nodes.length <= 0)
            return false;
        const last_node = nodes[nodes.length - 1];
        return last_node.type === esprima_1.Syntax.ReturnStatement || last_node.type === esprima_1.Syntax.BreakStatement;
    }
}
class SwitchCaseRemoverOperator extends SwitchCaseChangerOperator {
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let switch_cases = this._switch_cases.filter(value => { return super.node_id(value) === 0; });
        let switch_cases_meta = this._switch_cases_meta.filter(value => { return super.node_id(value) === 0; });
        if (switch_cases.length > 0) {
            let index = rand_1.Rand.range(switch_cases.length);
            let node = switch_cases[index];
            let meta = switch_cases_meta[index];
            return super.cleaned_code.slice(0, meta.start.offset) +
                super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.SwitchCaseRemoverOperator = SwitchCaseRemoverOperator;
class SwitchCaseFallthroughOperator extends SwitchCaseChangerOperator {
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let switch_cases = this._switch_cases.filter(value => { return super.node_id(value) === 0; });
        let switch_cases_meta = this._switch_cases_meta.filter(value => { return super.node_id(value) === 0; });
        if (switch_cases.length > 0) {
            let index = rand_1.Rand.range(switch_cases.length);
            let node = switch_cases[index];
            let meta = switch_cases_meta[index];
            let statements = gens_1.extract().from(node.consequent);
            let removeables = [];
            for (let statement of statements) {
                if (statement.type === esprima_1.Syntax.ReturnStatement || statement.type === esprima_1.Syntax.BreakStatement) {
                    removeables.push(statement);
                }
            }
            if (removeables.length > 0) {
                let remove_indices = new Set(rand_1.Rand.generate(removeables.length, rand_1.Rand.range, removeables.length));
                removeables = removeables.filter((val, index) => remove_indices.has(index));
                removeables.map(val => lodash_1.default.assign(val, { type: esprima_1.Syntax.EmptyStatement }));
                const patch = gens_1.gencode(escodegen_1.default, node);
                return super.cleaned_code.slice(0, meta.start.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }
        return super.cleaned_code;
    }
}
exports.SwitchCaseFallthroughOperator = SwitchCaseFallthroughOperator;
class SwitchCaseBreakOperator extends SwitchCaseNonFallThroughOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return '\n' + ' '.repeat(indent) + "    break;";
    }
}
exports.SwitchCaseBreakOperator = SwitchCaseBreakOperator;
class SwitchCaseReturnNullOperator extends SwitchCaseNonFallThroughOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return '\n' + ' '.repeat(indent) + "    return null;";
    }
}
exports.SwitchCaseReturnNullOperator = SwitchCaseReturnNullOperator;
class SwitchCaseReturnUndefinedOperator extends SwitchCaseNonFallThroughOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return '\n' + ' '.repeat(indent) + "    return undefined;";
    }
}
exports.SwitchCaseReturnUndefinedOperator = SwitchCaseReturnUndefinedOperator;
class SwitchCaseStrictBreakOperator extends SwitchCaseStrictNonFallThroughOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return '\n' + ' '.repeat(indent) + "    break;";
    }
}
exports.SwitchCaseStrictBreakOperator = SwitchCaseStrictBreakOperator;
class SwitchCaseStrictReturnNullOperator extends SwitchCaseStrictNonFallThroughOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return '\n' + ' '.repeat(indent) + "    return null;";
    }
}
exports.SwitchCaseStrictReturnNullOperator = SwitchCaseStrictReturnNullOperator;
class SwitchCaseStrictReturnUndefinedOperator extends SwitchCaseStrictNonFallThroughOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return '\n' + ' '.repeat(indent) + "    return undefined;";
    }
}
exports.SwitchCaseStrictReturnUndefinedOperator = SwitchCaseStrictReturnUndefinedOperator;
