"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
class ConditionalInverterOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._conditionals = [];
        this._conditionals_meta = [];
        this._test_range = [];
    }
    _init() {
        this._conditionals = [];
        this._conditionals_meta = [];
        this._test_range = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);
                this._test_range.push(node.test.range);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        if (this._conditionals.length > 0) {
            const if_index = rand_1.Rand.range(this._test_range.length);
            const range_if = this._test_range[if_index];
            let patch = "!(" + super.cleaned_code.slice(range_if[0], range_if[1]) + ')';
            // kill generated redundancies
            if (patch.indexOf("!(!(", 0) === 0) {
                // slice off supposed first "!(!(" and last "))" part of the string
                let try_patch = patch.slice(4, -2);
                let temp = try_patch;
                let count = 0;
                let fail = false;
                // continue until we can find either '(' or ')' character
                const search_regex = /[()]/;
                for (let i = temp.search(search_regex); i >= 0; i = temp.search(search_regex)) {
                    // save the found character
                    let character = temp[i];
                    // slice off the first part of the string, after the found character
                    temp = temp.slice(i + 1);
                    // if the character is a closing parenthesis
                    // we decrease the count variable by one
                    if (character === ')') {
                        --count;
                        // if the counting goes below zero
                        // then, there is no redundant parts
                        // in the patch
                        if (count < 0) {
                            fail = true;
                            break;
                        }
                    }
                    else
                        ++count;
                }
                // if the counting is not zero
                // then, the trimmed patch is discarded
                if (count !== 0)
                    fail = true;
                // discard the new patch if needed
                if (!fail)
                    patch = try_patch;
            }
            return super.cleaned_code.slice(0, range_if[0]) +
                patch + super.cleaned_code.slice(range_if[1]);
        }
        return super.cleaned_code;
    }
}
exports.ConditionalInverterOperator = ConditionalInverterOperator;
