import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";

// TODO: is this all?
export const mutations = [
    "===", "!==",
    "<=", ">=",
    "!=", "==",
    "<", ">",
    '|', '&', '^'
];


export class ConditionalTypeChangerOperator extends MutationOperator {
    private _binaries: Array<estree.BinaryExpression> = [];
    private _binaries_meta: Array<any> = [];

    constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._binaries = [];
        this._binaries_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata)) {
            // filter for BinaryExpressions,
            // this does NOT include LogicalExpressions like && and ||
            if (node.type === Syntax.BinaryExpression) {
                // if replaceable operator is in the list
                if (mutations.indexOf(node.operator) >= 0) {
                    this._binaries.push(node);
                    this._binaries_meta.push(metadata);
                }
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._binaries.length > 0) {
            let patch = mutations[Rand.range(mutations.length)];

            const index = Rand.range(this._binaries.length);
            const node = this._binaries[index];
            const meta = this._binaries_meta[index];

            const binexpr = super.code.slice(meta.start.offset, meta.end.offset);
            patch = binexpr.replace(node.operator.toString(), patch);

            return super.code.slice(0, meta.start.offset) +
                patch + super.code.slice(meta.end.offset);
        }

        return super.code;
    }
}
