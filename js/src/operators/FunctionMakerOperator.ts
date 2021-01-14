import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


export class FunctionMakerOperator extends MutationOperator {
    private _entries: Array<estree.Identifier | estree.MemberExpression | estree.CallExpression> = [];
    private _entries_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._entries = [];
        this._entries_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.Identifier ||
                node.type === Syntax.MemberExpression ||
                node.type === Syntax.CallExpression) {
                this._entries.push(node);
                this._entries_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });


        if (entries.length > 0) {
            const index = Rand.range(entries.length);
            const node = entries[index];
            const meta = entries_meta[index];


            const patch = super.node_code(node) + "()";

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);

        }

        return super.cleaned_code;
    }
}
