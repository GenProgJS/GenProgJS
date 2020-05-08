import { Syntax } from "esprima";
import estree from "estree";
import escodegen from "escodegen"
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";
import * as config from "./config/config.json";
import { Genode, gencode } from "./gens/index";


export class MutExprStatementInserterOperator extends MutationOperator {
    private _nodes: Array<estree.Node> = [];
    private _meta: Array<any>= [];
    private _buggy_statements: Array<estree.ExpressionStatement> = [];
    private _buggy_statements_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._nodes = [];
        this._meta = [];
        this._buggy_statements = [];
        this._buggy_statements_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata)) {
            if (node.type === Syntax.ExpressionStatement) {
                this._buggy_statements.push(node);
                this._buggy_statements_meta.push(metadata);
            }
        }
        this._nodes.push(node);
        this._meta.push(metadata);
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._buggy_statements.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(this._buggy_statements.length);

            const bug = this._buggy_statements[index];
            const bug_meta = this._buggy_statements_meta[index];

            let nodes, metadata;
            [nodes, metadata] = filters.filter_by_offset(this._nodes, this._meta,
                bug_meta, config.left_offset_threshold, config.right_offset_threshold);
            [nodes, metadata] = filters.filter_between(nodes, metadata, bug_meta.start.offset, bug_meta.end.offset);

            let gensim = Math.random() < 0.5;
            let new_node: estree.Node;

            try {
                if (gensim)
                    new_node = Genode("Expression").sim(bug).using(nodes);
                else
                    new_node = Genode("Expression").using(nodes);

                if (new_node.type !== Syntax.ExpressionStatement) {
                    let statement: estree.ExpressionStatement = {
                        type: Syntax.ExpressionStatement,
                        expression: new_node as estree.Expression
                    }

                    new_node = statement;
                }
            }
            catch (err) {
                this._err = err;
                return super.code;
            }

            if (new_node) {
                // before/after boolean - before = true, after = false
                const befter = Math.random() < 0.5;
                const patch = gencode(escodegen, new_node);

                if (befter) {
                    return super.code.slice(0, bug_meta.start.offset) +
                        patch + '\n' + super.code.slice(bug_meta.start.offset);
                }
                else {
                    return super.code.slice(0, bug_meta.end.offset) +
                        '\n' + patch + super.code.slice(bug_meta.end.offset);
                }
            }
        }

        return super.code;
    }
}
