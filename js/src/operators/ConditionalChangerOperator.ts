import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


export class ConditionalChangerOperator extends MutationOperator {
    private _conditionals: Array<estree.IfStatement> = [];
    private _conditionals_meta: Array<any> = [];
    private _test_range: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._conditionals = [];
        this._conditionals_meta = [];
        this._test_range = [];
        super._init();
    }

    protected _operator(node: estree.IfStatement, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);
                this._test_range.push(node.test.range);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._conditionals.length > 0) {
            const patch = Math.random() < 0.5 ? "false" : "true";

            const if_index = Rand.range(this._test_range.length);
            const range_inf = this._test_range[if_index];

            return super.code.slice(0, range_inf[0]) +
                patch + super.code.slice(range_inf[1]);
        }

        return super.code;
    }
}
