import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


export class EvalMutationOperator extends MutationOperator {
    private _entries: Array<estree.Node> = [];
    private _entries_meta: Array<any> = [];
    private _evals: Array<estree.CallExpression> = [];
    private _evals_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._entries = [];
        this._entries_meta = [];
        this._evals = [];
        this._evals_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        this._entries.push(node);
        this._entries_meta.push(metadata);

        this.stash(node, metadata);

        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.CallExpression && this.node_code(node.callee) === "eval") {
                this._evals.push(node);
                this._evals_meta.push(metadata);
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let entries = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });
        let evals = this._evals.filter(value => { return super.node_id(value) === 0; });
        let evals_meta = this._evals_meta.filter(value => { return super.node_id(value) === 0; });


        if (evals.length > 0) {
            const index = Rand.range(evals.length);
            const node = evals[index];
            const meta = evals_meta[index];

            if (node.arguments[0].type === Syntax.Literal) {
                return this.node_code(node.arguments[0]);
            }

            try {
                let inner;
                const call_arg = this.cleaned_code.substring(node.callee.range?.[1] as number, meta.end.offset);
                const stringified_arg = "new String" + call_arg;
                const result = "eval(inner=" + stringified_arg + ")";

                const code = this.cleaned_code.slice(0, meta.start.offset) +
                    result + this.cleaned_code.slice(meta.end.offset);
                let eval_this = code + "\ninner;"
                let eval_code: string = eval(eval_this)?.toString();

                // this means that the evaluation does not reach the specified eval() command
                // we will try to get the eval() function to work in the global scope
                if (eval_code === undefined || inner === undefined) {
                    eval_this = code + "\neval(" + stringified_arg + ");";
                    eval_code = eval(eval_this)?.toString();
                }

                return eval_code;
            }
            catch (err) {
                this._err = err;
            }
        }

        return super.cleaned_code;
    }
}
