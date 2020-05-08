import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { filter_expr_type } from "./filters/filters";


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
        if (this.is_buggy_line(metadata)) {
            if (node.type ===  Syntax.ExpressionStatement) {
                this._buggy_expressions.push(node);
                this._buggy_expressions_meta.push(metadata);
            }
        }
        else if (node.type ===  Syntax.ExpressionStatement) {
            this._expressions.push(node);
            this._expressions_meta.push(metadata);
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._buggy_expressions.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(this._buggy_expressions.length);

            const node = this._buggy_expressions[index];
            const meta = this._buggy_expressions_meta[index];

            let matching_expressions, matching_expressions_meta;
            [matching_expressions, matching_expressions_meta] = filter_expr_type(
                this._expressions, this._expressions_meta, node.expression.type);

            if (matching_expressions.length > 0) {
                const new_expr_index = Rand.range(matching_expressions.length);
                const substitute = matching_expressions[new_expr_index];
                const substitute_meta = matching_expressions_meta[new_expr_index];

                const patch = super.code.slice(substitute_meta.start.offset, substitute_meta.end.offset);

                return super.code.slice(0, meta.start.offset) +
                    patch + super.code.slice(meta.end.offset);
            }
        }

        return super.code;
    }
}
