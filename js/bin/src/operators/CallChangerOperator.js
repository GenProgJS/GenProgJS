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
const config = __importStar(require("./config/config.json"));
const remove_probability = 0.7;
const append_probability = 0.3;
class CallChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._calls = [];
        this._calls_meta = [];
        this._literals = [];
        this._literals_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
    }
    _init() {
        this._calls = [];
        this._calls_meta = [];
        this._literals = [];
        this._literals_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        const cond = (node.type === esprima_1.Syntax.Literal || (node.type === esprima_1.Syntax.UnaryExpression &&
            node.operator === '-' && node.prefix === true)) ||
            node.type === esprima_1.Syntax.MemberExpression ||
            node.type === esprima_1.Syntax.Identifier ||
            node.type === esprima_1.Syntax.CallExpression;
        // save every variable name
        if (node.type === esprima_1.Syntax.Literal || (node.type === esprima_1.Syntax.UnaryExpression &&
            node.operator === '-' && node.prefix === true)) {
            this._literals.push(node);
            this._literals_meta.push(metadata);
        }
        else if (node.type === esprima_1.Syntax.MemberExpression) {
            this._members.push(node);
            this._members_meta.push(metadata);
        }
        else if (node.type === esprima_1.Syntax.Identifier) {
            this._idents.push(node);
            this._idents_meta.push(metadata);
        }
        // get call expressions from the buggy line
        if (this.is_buggy_line(metadata)) {
            if (node.type === esprima_1.Syntax.CallExpression) {
                this._calls.push(node);
                this._calls_meta.push(metadata);
            }
        }
        if (cond)
            this.stash(node, metadata);
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let calls = this._calls.filter(value => { return super.node_id(value) === 0; });
        let calls_meta = this._calls_meta.filter(value => { return super.node_id(value) === 0; });
        if (calls.length > 0 && (this._members.length > 0 || this._idents.length > 0)) {
            let filt_literals;
            let filt_literals_meta;
            [filt_literals, filt_literals_meta] = filters.filter_duplicate_numerics(this._literals, this._literals_meta);
            let everyone = [], everyone_meta = [];
            everyone = everyone.concat(this._idents).concat(this._members).concat(filt_literals);
            everyone_meta = this._idents_meta.concat(this._members_meta).concat(filt_literals_meta);
            let callee_index = rand_1.Rand.range(calls.length);
            let selected_call = calls[callee_index];
            let selected_call_meta = calls_meta[callee_index];
            let args = [];
            let args_meta = [];
            for (let i = 0; i < everyone_meta.length; ++i) {
                if (everyone_meta[i].start.offset > selected_call_meta.start.offset &&
                    everyone_meta[i].end.offset < selected_call_meta.end.offset) {
                    args.push(everyone[i]);
                    args_meta.push((everyone_meta[i]));
                }
            }
            [args, args_meta] = filters.filter_lower_orders(args, args_meta);
            [everyone, everyone_meta] = filters.remove_duplicates(everyone, everyone_meta);
            [everyone, everyone_meta] = filters.filter_by_offset(everyone, everyone_meta, selected_call_meta, CallChangerOperator._config.left_offset_threshold, CallChangerOperator._config.right_offset_threshold);
            let append = Math.random() < append_probability ? 1 : 0;
            let remove = Math.random() < remove_probability ? 1 : 0;
            // signal for parameter change
            if (!(append ^ remove) && args.length && everyone.length) {
                // choose an argument to change
                let change_index = rand_1.Rand.range(args.length);
                // choose an identifier from the list
                let new_identifier_index = rand_1.Rand.range(everyone.length);
                let new_identifier = everyone[new_identifier_index];
                let new_metadata = everyone_meta[new_identifier_index];
                // get metadata of the chosen argument
                let changeling_meta = args_meta[change_index];
                // generate patch
                let patch = super.node_code(new_identifier);
                // insert patch into unmodified code
                return super.cleaned_code.slice(0, changeling_meta.start.offset) +
                    patch + super.cleaned_code.slice(changeling_meta.end.offset);
            }
            // signal for removing argument
            else if (remove && args.length) {
                // choose an argument to remove
                let remove_index = rand_1.Rand.range(args.length);
                let removable_meta = args_meta[remove_index];
                // if the there is just one call argument, then
                // no post processing is needed
                if (args.length === 1) {
                    return super.cleaned_code.slice(0, removable_meta.start.offset) +
                        super.cleaned_code.slice(removable_meta.end.offset);
                }
                // if we want to remove the last argument
                else if (remove_index === args.length - 1) {
                    // find previous argument's offset
                    let prev_meta = args_meta[remove_index - 1];
                    return super.cleaned_code.slice(0, prev_meta.end.offset) +
                        super.cleaned_code.slice(removable_meta.end.offset);
                }
                else {
                    // find the next argument's offset
                    let next_meta = args_meta[remove_index + 1];
                    return super.cleaned_code.slice(0, removable_meta.start.offset) +
                        super.cleaned_code.slice(next_meta.start.offset);
                }
            }
            // signal for appending an argument to the function call
            else if (everyone.length > 0) {
                // choose an index for the new argument
                let push_index = rand_1.Rand.range(args.length + 1);
                // choose an identifier from the list
                let new_identifier_index = rand_1.Rand.range(everyone.length);
                let new_identifier = everyone[new_identifier_index];
                let new_metadata = everyone_meta[new_identifier_index];
                // if there are no arguments, generate one
                if (args.length <= 0) {
                    let patch = super.node_code(new_identifier);
                    return super.cleaned_code.slice(0, selected_call_meta.end.offset - 1) +
                        patch + super.cleaned_code.slice(selected_call_meta.end.offset - 1);
                }
                // if there are call arguments
                // there will be two separate cases
                else {
                    // push after the last argument
                    if (push_index === args.length) {
                        // generate patch
                        let patch = ", " + super.node_code(new_identifier);
                        return super.cleaned_code.slice(0, selected_call_meta.end.offset - 1) +
                            patch + super.cleaned_code.slice(selected_call_meta.end.offset - 1);
                    }
                    // insert before a chosen argument
                    else {
                        let changeling_meta = args_meta[push_index];
                        // generate patch
                        let patch = super.node_code(new_identifier) + ", ";
                        return super.cleaned_code.slice(0, changeling_meta.start.offset) +
                            patch + super.cleaned_code.slice(changeling_meta.start.offset);
                    }
                }
            }
        }
        return super.cleaned_code;
    }
}
exports.CallChangerOperator = CallChangerOperator;
CallChangerOperator._config = config;
