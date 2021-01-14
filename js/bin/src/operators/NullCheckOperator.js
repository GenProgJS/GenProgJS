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
class NullCheckOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._calls = [];
        this._calls_meta = [];
        this._unaries = [];
        this._unaries_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
    }
    _init() {
        this._calls = [];
        this._calls_meta = [];
        this._unaries = [];
        this._unaries_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.MemberExpression) {
                this._members.push(node);
                this._members_meta.push(metadata);
            }
            else if (node.type === esprima_1.Syntax.CallExpression) {
                this._calls.push(node);
                this._calls_meta.push(metadata);
            }
            else if (node.type === esprima_1.Syntax.Identifier) {
                this._idents.push(node);
                this._idents_meta.push(metadata);
            }
            else if (node.type === esprima_1.Syntax.UnaryExpression) {
                this._unaries.push(node);
                this._unaries_meta.push(metadata);
            }
        }
        if (node.type === esprima_1.Syntax.MemberExpression || node.type === esprima_1.Syntax.CallExpression ||
            node.type === esprima_1.Syntax.Identifier || node.type === esprima_1.Syntax.UnaryExpression) {
            this.stash(node, metadata);
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let everyone = [];
        let everyone_meta = [];
        everyone = everyone.concat(this._idents).concat(this._members)
            .concat(this._unaries).concat(this._calls);
        everyone_meta = everyone_meta.concat(this._idents_meta).concat(this._members_meta)
            .concat(this._unaries_meta).concat(this._calls_meta);
        if (everyone.length > 0) {
            [everyone, everyone_meta] = filters.remove_duplicates(everyone, everyone_meta);
            //[everyone, everyone_meta] = filters.filter_lower_orders(everyone, everyone_meta);
            let rand = rand_1.Rand.range(everyone.length);
            const node = everyone[rand];
            const meta = everyone_meta[rand];
            let patch = super.node_code(meta);
            patch += " && ";
            patch = Math.random() < 0.5 ? patch : '!' + patch;
            // kill generated redundant logical negates
            if (patch.indexOf('!!', 0) === 0) {
                patch = patch.slice(2, patch.length);
            }
            // insert before
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.start.offset);
        }
        return super.cleaned_code;
    }
}
exports.NullCheckOperator = NullCheckOperator;
