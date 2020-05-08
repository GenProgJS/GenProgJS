import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";
import * as config from "./config/config.json"


export class ExprStatementInserterOperator extends MutationOperator {
    private _statements: Array<estree.ExpressionStatement> = [];
    private _statements_meta: Array<any> = [];
    private _buggy_statements: Array<estree.ExpressionStatement> = [];
    private _buggy_statements_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._buggy_statements = [];
        this._buggy_statements_meta = [];
        this._statements = [];
        this._statements_meta = [];
        super._init();
    }

    protected _operator(node: estree.ExpressionStatement, metadata: any): void {
        if (this.is_buggy_line(metadata)) {
            if (node.type ===  Syntax.ExpressionStatement) {
                this._buggy_statements.push(node);
                this._buggy_statements_meta.push(metadata);
            }
        }
        else {
            if (node.type ===  Syntax.ExpressionStatement) {
                this._statements.push(node);
                this._statements_meta.push(metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._buggy_statements.length > 0 && this._statements.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(this._buggy_statements.length);

            const node = this._buggy_statements[index];
            const meta = this._buggy_statements_meta[index];

            let insertion, insertion_meta;
            [insertion, insertion_meta] = filters.filter_by_offset(this._statements, this._statements_meta,
                meta, config.left_offset_threshold, config.right_offset_threshold);


            if (insertion.length > 0) {
                // before/after boolean - before = true, after = false
                const befter = Math.random() < 0.5;

                const ins_index = Rand.range(insertion.length);
                insertion = insertion[ins_index];
                insertion_meta = insertion_meta[ins_index];

                const patch = super.code.slice(insertion_meta.start.offset, insertion_meta.end.offset);

                if (befter) {
                    return super.code.slice(0, meta.start.offset) +
                        patch + '\n' + super.code.slice(meta.start.offset);
                }
                else {
                    return super.code.slice(0, meta.end.offset) +
                        '\n' + patch + super.code.slice(meta.end.offset);
                }
            }
        }

        return super.code;
    }
}
