import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


abstract class ReturnNoneOperator extends MutationOperator {
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
            if (node.type === Syntax.ExpressionStatement ||
                node.type === Syntax.BreakStatement ||
                node.type === Syntax.ContinueStatement ||
                node.type === Syntax.ReturnStatement) {
                this._nodes.push(node);
                this._meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }

    protected abstract _none(): string;

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        this._nodes = this._nodes.filter(value => { return super.node_id(value) === 0; });
        this._meta = this._meta.filter(value => { return super.node_id(value) === 0; });


        if (this._nodes.length > 0) {
            // possibly always be 0, but who knows...
            // in case of multiple expressions in one line
            const index = Rand.range(this._nodes.length);

            const node = this._nodes[index];
            const meta = this._meta[index];

            return super.cleaned_code.slice(0, meta.start.offset) +
                "return " + this._none() + ";" + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


export class ReturnNullOperator extends ReturnNoneOperator {
    protected _none(): string {
        return "null";
    }
}


export class ReturnUndefinedOperator extends ReturnNoneOperator {
    protected _none(): string {
        return "undefined";
    }
}
