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
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.ExpressionStatement) {
                this._buggy_statements.push(node);
                this._buggy_statements_meta.push(metadata);
            }
        }
        this._nodes.push(node);
        this._meta.push(metadata);

        this.stash(node, metadata);
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let buggy_statements = this._buggy_statements.filter(value => { return super.node_id(value) === 0; });
        let buggy_statements_meta = this._buggy_statements_meta.filter(value => { return super.node_id(value) === 0; });
    
        if (buggy_statements.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(buggy_statements.length);

            const bug = buggy_statements[index];
            const bug_meta = buggy_statements_meta[index];

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
                return super.cleaned_code;
            }

            if (new_node) {
                // before/after boolean - before = true, after = false
                const befter = Math.random() < 0.5;
                const patch = gencode(escodegen, new_node);

                if (befter) {
                    return super.cleaned_code.slice(0, bug_meta.start.offset) +
                        patch + '\n' + super.cleaned_code.slice(bug_meta.start.offset);
                }
                else {
                    return super.cleaned_code.slice(0, bug_meta.end.offset) +
                        '\n' + patch + super.cleaned_code.slice(bug_meta.end.offset);
                }
            }
        }

        return super.cleaned_code;
    }
}
