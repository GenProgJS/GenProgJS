import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


const mutations: Set<string> = new Set(['|', '&', '^', '~']);


export class BitwiseBinaryOperatorChanger extends MutationOperator {
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
        if (this.is_buggy_line(metadata, false)) {
            // filter for BinaryExpressions,
            // this does NOT include LogicalExpressions like && and ||
            if (node.type === Syntax.BinaryExpression) {
                // if replaceable operator is in the list
                if (mutations.has(node.operator)) {
                    this._binaries.push(node);
                    this._binaries_meta.push(metadata);

                    this.stash(node, metadata);
                }
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let binaries = this._binaries.filter(value => { return super.node_id(value) === 0; });
        let binaries_meta = this._binaries_meta.filter(value => { return super.node_id(value) === 0; });

        if (binaries.length > 0) {
            const mut_values = Array.from(mutations.values())
            let patch = mut_values[Rand.range(mut_values.length)];

            const index = Rand.range(binaries.length);
            const node = binaries[index];
            const meta = binaries_meta[index];

            const binexpr = super.cleaned_code.slice(meta.start.offset, meta.end.offset);
            patch = binexpr.replace(node.operator.toString(), patch);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}
