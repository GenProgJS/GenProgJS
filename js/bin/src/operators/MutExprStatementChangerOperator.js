"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const escodegen_1 = __importDefault(require("escodegen"));
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const filters = __importStar(require("./filters/filters"));
const config = __importStar(require("./config/config.json"));
const index_1 = require("./gens/index");
class MutExprStatementChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._nodes = [];
        this._meta = [];
        this._buggy_statements = [];
        this._buggy_statements_meta = [];
    }
    _init() {
        this._nodes = [];
        this._meta = [];
        this._buggy_statements = [];
        this._buggy_statements_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata)) {
            if (node.type === esprima_1.Syntax.ExpressionStatement) {
                this._buggy_statements.push(node);
                this._buggy_statements_meta.push(metadata);
            }
        }
        this._nodes.push(node);
        this._meta.push(metadata);
    }
    _generate_patch() {
        if (this._err !== null)
            return super.code;
        if (this._buggy_statements.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = rand_1.Rand.range(this._buggy_statements.length);
            const bug = this._buggy_statements[index];
            const bug_meta = this._buggy_statements_meta[index];
            let nodes, metadata;
            [nodes, metadata] = filters.filter_by_offset(this._nodes, this._meta, bug_meta, config.left_offset_threshold, config.right_offset_threshold);
            [nodes, metadata] = filters.filter_between(nodes, metadata, bug_meta.start.offset, bug_meta.end.offset);
            let gensim = Math.random() < 0.5;
            let new_node;
            try {
                if (gensim)
                    new_node = index_1.Genode("Expression").sim(bug).using(nodes);
                else
                    new_node = index_1.Genode("Expression").using(nodes);
                if (new_node.type !== esprima_1.Syntax.ExpressionStatement) {
                    let statement = {
                        type: esprima_1.Syntax.ExpressionStatement,
                        expression: new_node
                    };
                    new_node = statement;
                }
            }
            catch (err) {
                this._err = err;
                return super.code;
                ;
            }
            if (new_node) {
                const patch = index_1.gencode(escodegen_1.default, new_node);
                return super.code.slice(0, bug_meta.start.offset) +
                    patch + super.code.slice(bug_meta.end.offset);
            }
        }
        return super.code;
    }
}
exports.MutExprStatementChangerOperator = MutExprStatementChangerOperator;
