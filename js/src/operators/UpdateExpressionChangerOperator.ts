import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


export class UpdateExpressionChangerOperator extends MutationOperator {
    private _updates: Array<estree.UpdateExpression> = [];
    private _updates_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._updates = [];
        this._updates_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (node.type === Syntax.UpdateExpression) {
            if (this.is_buggy_line(metadata, false)) {
                this._updates.push(node);
                this._updates_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let updates = this._updates.filter(value => { return super.node_id(value) === 0; });
        let updates_meta = this._updates_meta.filter(value => { return super.node_id(value) === 0; });
        
        if (updates.length > 0) {
            const index = Rand.range(updates.length);
            const buggy = updates[index];
            const meta = updates_meta[index];
            
            const argument = super.cleaned_code.substring(buggy.argument.range?.[0] as number, buggy.argument.range?.[1] as number);
            const operator = buggy.operator === "++" ? "--" : "++";
            let patch = argument + operator;

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}
