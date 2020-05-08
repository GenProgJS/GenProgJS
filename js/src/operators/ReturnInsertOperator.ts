import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


export class ReturnInsertOperator extends MutationOperator {
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
        if (this.is_buggy_line(metadata)) {
            if (node.type === Syntax.ExpressionStatement) {
                this._nodes.push(node);
                this._meta.push(metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._nodes.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(this._nodes.length);

            const node = this._nodes[index];
            const meta = this._meta[index];

            return super.code.slice(0, meta.start.offset) +
                "return " + super.code.slice(meta.start.offset);
        }

        return super.code;
    }
}
