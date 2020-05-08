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

    protected _operator(node: estree.Expression, metadata: any): void {
        if (ExprReplacerOperator._exclude.includes(node.type))
            return;

        if (this.is_buggy_line(metadata)) {
            // filter for every type of expressions
            // excluding ExpressionStatements
            if (node.type.indexOf("Expression") > 0) {
                this._buggy_expressions.push(node);
                this._buggy_expressions_meta.push(metadata);
                this._expressions.push(node);
                this._expressions_meta.push(metadata);
            }
        }
        else if (node.type.indexOf("Expression") > 0) {
            this._expressions.push(node);
            this._expressions_meta.push(metadata);
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._buggy_expressions.length > 0) {
            const index = Rand.range(this._buggy_expressions.length);
            const buggy = this._buggy_expressions[index];
            const meta = this._buggy_expressions_meta[index];


            let replacements, replacements_meta;
            [replacements, replacements_meta] = filters.filter_expr_type(
                this._expressions, this._expressions_meta, buggy.type);

            
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

                    const buggy_code = super.code.slice(meta.start.offset, meta.end.offset);
                    const insert_index = buggy_code.indexOf(buggy.operator);
                    const temp = super.code.slice(replacement_meta.start.offset, replacement_meta.end.offset);
                    const pos = temp.indexOf(replacement.operator);

                    if (replace_op) {
                        patch = temp.slice(pos);

                        patch = buggy_code.substr(0, insert_index) + patch;
                    }
                    else {
                        patch = super.code.slice(replacement.right.range[0], replacement.right.range[1]);

                        return super.code.slice(0, (buggy as any).right.range[0]) +
                            patch + super.code.slice((buggy as any).right.range[1]);
                    }
                }
                else {
                    patch = super.code.slice(replacement_meta.start.offset, replacement_meta.end.offset);
                }

                return super.code.slice(0, meta.start.offset) +
                    patch + super.code.slice(meta.end.offset);
            }
        }

        return super.code;
    }
}
