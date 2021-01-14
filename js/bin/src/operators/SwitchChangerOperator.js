"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class SwitchChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this.__switch_statements = [];
        this.__switch_statements_meta = [];
    }
    _init() {
        this.__switch_statements = [];
        this.__switch_statements_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.SwitchStatement) {
                this.__switch_statements.push(node);
                this.__switch_statements_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    get _switch_statements() { return this.__switch_statements.slice(); }
    get _switch_statements_meta() { return this.__switch_statements_meta.slice(); }
}
class SwitchNestedCaseRemoverOperator extends SwitchChangerOperator {
    _generate_patch() {
        var _a, _b;
        if (this._err !== null)
            return super.cleaned_code;
        let switch_statements = this._switch_statements.filter(value => { return super.node_id(value) === 0; });
        let switch_statements_meta = this._switch_statements_meta.filter(value => { return super.node_id(value) === 0; });
        if (switch_statements.length > 0) {
            let index = rand_1.Rand.range(switch_statements.length);
            let node = switch_statements[index];
            let meta = switch_statements_meta[index];
            let switch_cases = node.cases;
            let rand_indices = rand_1.Rand.generate(switch_cases.length, rand_1.Rand.range, switch_cases.length);
            let uniq_indices = Array.from(new Set(rand_indices));
            uniq_indices.sort((left, right) => right - left);
            let ss = meta.start.offset;
            let switch_code = this.node_code(node);
            // remove case-code slices from code
            let patch = switch_code;
            for (let ci of uniq_indices) {
                patch = patch.slice(0, ((_a = switch_cases[ci].range) === null || _a === void 0 ? void 0 : _a[0]) - ss) +
                    patch.slice(((_b = switch_cases[ci].range) === null || _b === void 0 ? void 0 : _b[1]) - ss);
            }
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.SwitchNestedCaseRemoverOperator = SwitchNestedCaseRemoverOperator;
class SwitchDefaultOperator extends SwitchChangerOperator {
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let switch_statements = this._switch_statements.filter(value => { return super.node_id(value) === 0; });
        let switch_statements_meta = this._switch_statements_meta.filter(value => { return super.node_id(value) === 0; });
        if (switch_statements.length > 0) {
            let index = rand_1.Rand.range(switch_statements.length);
            let node = switch_statements[index];
            let meta = switch_statements_meta[index];
            let default_case = () => {
                for (let i = 0; i < node.cases.length; ++i) {
                    if (node.cases[i].test === null)
                        return node.cases[i];
                }
                return null;
            };
            if (default_case() !== null) {
                return super.cleaned_code;
            }
            const patch = this._default(node, meta);
            return super.cleaned_code.slice(0, meta.end.offset - 1) +
                patch + super.cleaned_code.slice(meta.end.offset - 1);
        }
        return super.cleaned_code;
    }
}
class SwitchDefaultReturnDiscriminantOperator extends SwitchDefaultOperator {
    _default(node, metadata) {
        var _a, _b, _c;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return "    default:\n" + ' '.repeat(indent) +
            "        return " + this.cleaned_code.substring((_b = node.discriminant.range) === null || _b === void 0 ? void 0 : _b[0], (_c = node.discriminant.range) === null || _c === void 0 ? void 0 : _c[1]) + ";\n" +
            ' '.repeat(indent);
    }
}
exports.SwitchDefaultReturnDiscriminantOperator = SwitchDefaultReturnDiscriminantOperator;
class SwitchDefaultReturnNullOperator extends SwitchDefaultOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return "    default:\n" + ' '.repeat(indent) +
            "        return null;\n" +
            ' '.repeat(indent);
    }
}
exports.SwitchDefaultReturnNullOperator = SwitchDefaultReturnNullOperator;
class SwitchDefaultReturnUndefinedOperator extends SwitchDefaultOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return "    default:\n" + ' '.repeat(indent) +
            "        return undefined;\n" +
            ' '.repeat(indent);
    }
}
exports.SwitchDefaultReturnUndefinedOperator = SwitchDefaultReturnUndefinedOperator;
class SwitchDefaultThrowOperator extends SwitchDefaultOperator {
    _default(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent === undefined) {
            indent = 0;
        }
        return "    default:\n" + ' '.repeat(indent) +
            "        throw Error('GenprogJS: automatically generated default throw');\n" +
            ' '.repeat(indent);
    }
}
exports.SwitchDefaultThrowOperator = SwitchDefaultThrowOperator;
