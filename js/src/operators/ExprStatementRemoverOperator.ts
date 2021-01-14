import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


export class ExprStatementRemoverOperator extends MutationOperator {
    private _nodes: Array<estree.ExpressionStatement> = [];
    private _meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._nodes = [];
        this._meta = [];
        super._init();
    }

    protected _operator(node: estree.ExpressionStatement, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.ExpressionStatement) {
                this._nodes.push(node);
                this._meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let nodes = this._nodes.filter(value => { return super.node_id(value) === 0; });
        let metadata = this._meta.filter(value => { return super.node_id(value) === 0; });

        if (nodes.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(nodes.length);

            const node = nodes[index];
            const meta = metadata[index];

            return super.cleaned_code.slice(0, meta.start.offset) +
                super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}
