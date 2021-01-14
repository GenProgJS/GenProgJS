import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";
import * as config from "./config/config.json"


const exclude: Array<string> = config.expr_replacer_exclude;

export class ExprReplacerOperator extends MutationOperator {
    private static _exclude = exclude;

    private _expressions: Array<estree.Expression> = [];
    private _expressions_meta: Array<any> = [];
    private _buggy_expressions: Array<estree.Expression> = [];
    private _buggy_expressions_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._expressions = [];
        this._expressions_meta = [];
        this._buggy_expressions = [];
        this._buggy_expressions_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (ExprReplacerOperator._exclude != null && ExprReplacerOperator._exclude.includes(node.type))
            return;

        // filter for every type of expressions
        // excluding ExpressionStatements
        if (node.type.indexOf("Expression") > 0) {
            if (this.is_buggy_line(metadata, false)) {
                this._buggy_expressions.push(node as estree.Expression);
                this._buggy_expressions_meta.push(metadata);
            }

            this._expressions.push(node as estree.Expression);
            this._expressions_meta.push(metadata);

            this.stash(node, metadata);
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let buggy_expressions = this._buggy_expressions.filter(value => { return super.node_id(value) === 0; });
        let buggy_expressions_meta = this._buggy_expressions_meta.filter(value => { return super.node_id(value) === 0; });

        if (buggy_expressions.length > 0) {
            const index = Rand.range(buggy_expressions.length);
            const buggy = buggy_expressions[index];
            const meta = buggy_expressions_meta[index];


            let replacements, replacements_meta;
            [replacements, replacements_meta] = filters.remove_duplicates(this._expressions, this._expressions_meta);

            [replacements, replacements_meta] = filters.filter_expr_type(
                replacements, replacements_meta, buggy.type);

            
            if ((buggy as filters.OperatorHolder).operator) {
                [replacements, replacements_meta] = filters.filter_by_operator_type(
                    replacements , replacements_meta, (buggy as filters.OperatorHolder).operator);
            }
            else if ((buggy as estree.MemberExpression).computed !== undefined) {
                [replacements, replacements_meta] = filters.filter_by_computed_member(
                    replacements, replacements_meta, (buggy as estree.MemberExpression).computed);
            }

            if (replacements.length > 0) {
                const repl_index = Rand.range(replacements.length);
                const replacement = replacements[repl_index];
                const replacement_meta = replacements_meta[repl_index];

                let patch;

                // if the expression is an AssignmentExpression there will be
                // fifty-fifty chance to replace the whole expression itself,
                // or only replace the assigned value
                const replace_partial = Math.random() < 0.5;

                if (buggy.type ===  Syntax.AssignmentExpression && replace_partial) {
                    // there is 50%, too to replace the assignment operator in the original code
                    const replace_op = Math.random() < 0.5;

                    const buggy_code = super.node_code(meta);
                    const insert_index = buggy_code.indexOf(buggy.operator);
                    const temp = super.node_code(replacement_meta);
                    const pos = temp.indexOf(replacement.operator);

                    if (replace_op) {
                        patch = temp.slice(pos);

                        patch = buggy_code.substr(0, insert_index) + patch;
                    }
                    else {
                        let node_id = super.node_id(replacement);

                        patch = super.codes[node_id].slice(replacement.right.range[0], replacement.right.range[1]);

                        return super.cleaned_code.slice(0, (buggy as any).right.range[0]) +
                            patch + super.cleaned_code.slice((buggy as any).right.range[1]);
                    }
                }
                else {
                    let node_id = super.node_id(replacement_meta);

                    patch = super.codes[node_id].slice(replacement_meta.start.offset, replacement_meta.end.offset);
                }

                return super.cleaned_code.slice(0, meta.start.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }

        return super.cleaned_code;
    }
}
