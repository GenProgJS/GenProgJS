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
        if (node.type === Syntax.ExpressionStatement) {
            if (this.is_buggy_line(metadata, false)) {
                this._buggy_statements.push(node);
                this._buggy_statements_meta.push(metadata);
            }

            this._statements.push(node);
            this._statements_meta.push(metadata);
            this.stash(node, metadata);
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let buggy_statements = this._buggy_statements.filter(value => { return super.node_id(value) === 0; });
        let buggy_statements_meta = this._buggy_statements_meta.filter(value => { return super.node_id(value) === 0; });

        if (buggy_statements.length > 0 && this._statements.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(buggy_statements.length);

            const node = buggy_statements[index];
            const meta = buggy_statements_meta[index];

            [this._statements, this._statements_meta] = filters.remove_duplicates(this._statements, this._statements_meta);

            let insertion, insertion_meta;
            [insertion, insertion_meta] = filters.filter_by_offset(this._statements, this._statements_meta,
                meta, config.left_offset_threshold, config.right_offset_threshold);


            if (insertion.length > 0) {
                // before/after boolean - before = true, after = false
                const befter = Math.random() < 0.5;

                const ins_index = Rand.range(insertion.length);
                insertion = insertion[ins_index];
                insertion_meta = insertion_meta[ins_index];

                const indent = node.loc?.start.column as number;
                const patch = super.node_code(insertion);
                
                if (befter) {
                    return super.cleaned_code.slice(0, meta.start.offset) +
                        patch + '\n' + ' '.repeat(indent) + super.code.slice(meta.start.offset);
                }
                else {
                    return super.cleaned_code.slice(0, meta.end.offset) +
                        '\n' + ' '.repeat(indent) + patch + super.code.slice(meta.end.offset);
                }
            }
        }

        return super.cleaned_code;
    }
}
