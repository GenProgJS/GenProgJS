import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


const mutations: Set<string> = new Set([
    "||", "&&"
]);


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
        if (this.is_buggy_line(metadata, false)) {
            // filter for BinaryExpressions,
            // only for logical expression like && and ||
            if (node.type === Syntax.LogicalExpression) {
                // if replaceable operator is in the list
                if (mutations.has(node.operator)) {
                    this._logicals.push(node);
                    this._logicals_meta.push(metadata);

                    this.stash(node, metadata);
                }
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let logicals = this._logicals.filter(value => { return super.node_id(value) === 0; });
        let logicals_meta = this._logicals_meta.filter(value => { return super.node_id(value) === 0; });

        if (logicals.length > 0) {
            const mut_values = Array.from(mutations.values())
            let patch = mut_values[Rand.range(mut_values.length)];

            const index = Rand.range(logicals.length);
            const node = logicals[index];
            const meta = logicals_meta[index];

            const logexpr = super.cleaned_code.slice(meta.start.offset, meta.end.offset);
            patch = logexpr.replace(node.operator.toString(), patch);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}
