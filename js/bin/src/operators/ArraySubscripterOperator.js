"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const filters_1 = require("./filters/filters");
class ArraySubscripterOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._computed_members = [];
        this._computed_members_meta = [];
        this._inners = [];
        this._inners_meta = [];
    }
    _init() {
        this._computed_members = [];
        this._computed_members_meta = [];
        this._inners = [];
        this._inners_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.MemberExpression &&
                node.computed && this._cleaned_code[metadata.end.offset - 1] === ']') {
                this._computed_members.push(node);
                this._computed_members_meta.push(metadata);
            }
            else {
                this._inners.push(node);
                this._inners_meta.push(metadata);
            }
            this.stash(node, metadata);
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let computed_members = this._computed_members.filter(value => { return super.node_id(value) === 0; });
        let computed_members_meta = this._computed_members_meta.filter(value => { return super.node_id(value) === 0; });
        let inners = this._inners.filter(value => { return super.node_id(value) === 0; });
        let inners_meta = this._inners_meta.filter(value => { return super.node_id(value) === 0; });
        if (computed_members.length > 0) {
            let change_index = rand_1.Rand.range(computed_members.length);
            const selected_entry = computed_members[change_index];
            const selected_entry_meta = computed_members_meta[change_index];
            [inners, inners_meta] = filters_1.keep_between(inners, inners_meta, selected_entry_meta.start.offset, selected_entry_meta.end.offset);
            const f = (nodes, meta) => {
                let filt = [];
                let filt_meta = [];
                filt.length = 2;
                filt_meta.length = 2;
                for (let i = 0; i < inners.length; ++i) {
                    let data = inners[i];
                    if (data === selected_entry.object) {
                        filt[0] = data;
                        filt_meta[0] = inners_meta[i];
                    }
                    else if (data === selected_entry.property) {
                        filt[1] = data;
                        filt_meta[1] = inners_meta[i];
                    }
                }
                return [filt, filt_meta];
            };
            [inners, inners_meta] = f(inners, inners_meta);
            const patch = this._subscripter(super.node_code(inners[0]), super.node_code(inners[1]));
            return super.cleaned_code.slice(0, inners_meta[1].start.offset) +
                patch + super.cleaned_code.slice(inners_meta[1].end.offset);
        }
        return super.cleaned_code;
    }
}
class ArraySubscriptCapOperator extends ArraySubscripterOperator {
    _subscripter(array_name, subscript) {
        return `${subscript} >= 0 ? ${subscript} < ${array_name}.length ? ${subscript} : ${array_name}.length - 1 : 0`;
    }
}
exports.ArraySubscriptCapOperator = ArraySubscriptCapOperator;
class ArraySubscriptRandOperator extends ArraySubscripterOperator {
    _subscripter(array_name, subscript) {
        return `${subscript} < 0 || ${subscript} >= ${array_name}.length ? Math.floor(Math.random() * ${array_name}.length) : ${subscript}`;
    }
}
exports.ArraySubscriptRandOperator = ArraySubscriptRandOperator;
class ArraySubscriptRemainderOperator extends ArraySubscripterOperator {
    _subscripter(array_name, subscript) {
        return `${subscript} % ${array_name}.length`;
    }
}
exports.ArraySubscriptRemainderOperator = ArraySubscriptRemainderOperator;
