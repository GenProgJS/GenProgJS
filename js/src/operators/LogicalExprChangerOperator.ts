import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";

// TODO: is this all?
const mutations = [
    "||", "&&"
];


export class LogicalExprChangerOperator extends MutationOperator {
    _logicals: Array<estree.LogicalExpression> = [];
    _logicals_meta: Array<any> = [];


    constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._logicals = [];
        this._logicals_meta = [];
        super._init();
    }

    protected _operator(node: estree.LogicalExpression, metadata: any): void {
        if (this.is_buggy_line(metadata)) {
            // filter for BinaryExpressions,
            // this does NOT include LogicalExpressions like && and ||
            if (node.type === Syntax.LogicalExpression) {
                // if replaceable operator is in the list
                if (mutations.indexOf(node.operator) >= 0) {
                    this._logicals.push(node);
                    this._logicals_meta.push(metadata);
                }
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._logicals.length > 0) {
            let patch = mutations[Rand.range(mutations.length)];

            const index = Rand.range(this._logicals.length);
            const node = this._logicals[index];
            const meta = this._logicals_meta[index];

            const logexpr = super.code.slice(meta.start.offset, meta.end.offset);
            patch = logexpr.replace(node.operator.toString(), patch);

            return super.code.slice(0, meta.start.offset) +
                patch + super.code.slice(meta.end.offset);
        }

        return super.code;
    }
}
