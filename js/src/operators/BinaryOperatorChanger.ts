import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


const binary_operators = [
    "===", "!==",
    "==", "!=",
    "<", ">", "<=", ">=",
    "&&", "||",
    "+", "-", "*", "/", "**", "%",
    "|", "&", "^", "~",
    "<<", ">>", ">>>"
];


export class BinaryOperatorChanger extends MutationOperator {
    private _buggy_bin_ops: Array<estree.BinaryExpression | estree.LogicalExpression> = [];
    private _buggy_bin_ops_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._buggy_bin_ops = [];
        this._buggy_bin_ops_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (node.type === Syntax.BinaryExpression ||
            node.type === Syntax.LogicalExpression) {
            if (this.is_buggy_line(metadata, false)) {
                this._buggy_bin_ops.push(node);
                this._buggy_bin_ops_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        this._buggy_bin_ops = this._buggy_bin_ops.filter(value => { return super.node_id(value) === 0; });
        this._buggy_bin_ops_meta = this._buggy_bin_ops_meta.filter(value => { return super.node_id(value) === 0; });
        
        if (this._buggy_bin_ops.length > 0) {
            const index = Rand.range(this._buggy_bin_ops.length);
            const buggy = this._buggy_bin_ops[index];
            const meta = this._buggy_bin_ops_meta[index];
            
            const repl = binary_operators[Rand.range(binary_operators.length)];
            
            let patch = super.cleaned_code.slice(meta.start.offset, meta.end.offset);
            patch = patch.replace(buggy.operator, repl);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}
