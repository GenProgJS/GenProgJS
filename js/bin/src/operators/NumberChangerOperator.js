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
class NumberChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._entries = [];
        this._meta = [];
    }
    _gen() {
        let r = Math.random();
        return r < 0.5 ? -1 : 1;
    }
    _init() {
        this._entries = [];
        this._meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata)) {
            if (node.type === esprima_1.Syntax.Literal) {
                if (!isNaN(Number(node.value))) {
                    this._entries.push(node);
                    this._meta.push(metadata);
                    this.stash(node, metadata);
                }
            }
            else if (node.type === esprima_1.Syntax.UnaryExpression &&
                node.operator === '-' && node.prefix === true) {
                if (!isNaN(Number(node.argument.value))) {
                    this._entries.push(node);
                    this._meta.push(metadata);
                    this.stash(node, metadata);
                }
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._meta.filter(value => { return super.node_id(value) === 0; });
        if (entries.length > 0) {
            let filt_entries = [];
            let filt_meta = [];
            [filt_entries, filt_meta] = filters.filter_duplicate_numerics(entries, entries_meta);
            const rand = rand_1.Rand.range(filt_entries.length);
            const entry = filt_entries[rand];
            const meta = filt_meta[rand];
            let val;
            if (entry.type === esprima_1.Syntax.Literal)
                val = Number(entry.value);
            else if (entry.type === esprima_1.Syntax.UnaryExpression)
                val = Number(entry.operator.concat(entry.argument.value));
            else
                return super.cleaned_code;
            if (isNaN(val))
                return super.cleaned_code;
            val += this._gen();
            let patch = val.toString();
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.NumberChangerOperator = NumberChangerOperator;
