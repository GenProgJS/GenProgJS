import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { filter_expr_type, remove_duplicates } from "./filters/filters";


export class ExprStatementChangerOperator extends MutationOperator {
    private _expressions: Array<estree.ExpressionStatement> = [];
    private _expressions_meta: Array<any> = [];
    private _buggy_expressions: Array<estree.ExpressionStatement> = [];
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

    protected _operator(node: estree.ExpressionStatement, metadata: any): void {
        if (node.type === Syntax.ExpressionStatement) {
            if (this.is_buggy_line(metadata, false)) {
                this._buggy_expressions.push(node);
                this._buggy_expressions_meta.push(metadata);
            }

            this._expressions.push(node);
            this._expressions_meta.push(metadata);

            this.stash(node, metadata);
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let buggy_expressions = [], buggy_expressions_meta = [];
        buggy_expressions = this._buggy_expressions.filter(value => { return super.node_id(value) === 0; });
        buggy_expressions_meta = this._buggy_expressions_meta.filter(value => { return super.node_id(value) === 0; });

        if (buggy_expressions.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(buggy_expressions.length);

            const node = buggy_expressions[index];
            const meta = buggy_expressions_meta[index];

            let matching_expressions, matching_expressions_meta;
            [matching_expressions, matching_expressions_meta] = filter_expr_type(
                this._expressions, this._expressions_meta, node.expression.type);

            [matching_expressions, matching_expressions_meta] = remove_duplicates(matching_expressions, matching_expressions_meta)
            

            if (matching_expressions.length > 0) {
                const new_expr_index = Rand.range(matching_expressions.length);
                const substitute = matching_expressions[new_expr_index];
                const substitute_meta = matching_expressions_meta[new_expr_index];

                const patch = super.node_code(substitute);

                return super.cleaned_code.slice(0, meta.start.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }

        return super.cleaned_code;
    }
}
