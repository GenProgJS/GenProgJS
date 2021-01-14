"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const lodash_1 = require("lodash");
class StringChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._strings = [];
        this._strings_meta = [];
    }
    _init() {
        this._strings = [];
        this._strings_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.Literal && lodash_1.isString(node.value)) {
                this._strings.push(node);
                this._strings_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let strings = this._strings.filter(value => { return super.node_id(value) === 0; });
        let strings_meta = this._strings_meta.filter(value => { return super.node_id(value) === 0; });
        if (strings.length > 0) {
            let index = rand_1.Rand.range(strings.length);
            let node = strings[index];
            let meta = strings_meta[index];
            const patch = this._default(node.value);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
class StringRemoverOperator extends StringChangerOperator {
    _default(input) {
        return "''";
    }
}
exports.StringRemoverOperator = StringRemoverOperator;
class StringToLowerCaseOperator extends StringChangerOperator {
    _default(input) {
        return "'" + input.toLowerCase() + "'";
    }
}
exports.StringToLowerCaseOperator = StringToLowerCaseOperator;
class StringToUpperCaseOperator extends StringChangerOperator {
    _default(input) {
        return "'" + input.toUpperCase() + "'";
    }
}
exports.StringToUpperCaseOperator = StringToUpperCaseOperator;
class StringPartitionOperator extends StringChangerOperator {
    _default(input) {
        return "'" + input.substring(rand_1.Rand.range(input.length), rand_1.Rand.range(input.length)) + "'";
    }
}
exports.StringPartitionOperator = StringPartitionOperator;
class StringCutOperator extends StringChangerOperator {
    _default(input) {
        const cut = input.substring(rand_1.Rand.range(input.length), rand_1.Rand.range(input.length));
        return "'" + input.replace(cut, '') + "'";
    }
}
exports.StringCutOperator = StringCutOperator;
