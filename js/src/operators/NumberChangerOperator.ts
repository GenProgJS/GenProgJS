import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";


export class NumberChangerOperator extends MutationOperator {
    private _entries: Array<estree.Literal | estree.UnaryExpression> = [];
    private _meta: Array<any> = [];
    
    
    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    private _gen(): number {
        let r = Math.random();
        return r < 0.5 ? -1 : 1;
    }

    protected _init(): void {
        this._entries = [];
        this._meta = [];
        super._init();
    }

    protected _operator(node: estree.Literal | estree.UnaryExpression, metadata: any): void {
        if (this.is_buggy_line(metadata)) {
            if (node.type === Syntax.Literal) {
                if (!isNaN(Number(node.value))) {
                    this._entries.push(node);
                    this._meta.push(metadata);
                }
            } else if (node.type === Syntax.UnaryExpression &&
                node.operator === '-' && node.prefix === true) {
                if (!isNaN(Number((node.argument as estree.Literal).value))) {
                    this._entries.push(node);
                    this._meta.push(metadata);
                }
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._entries.length > 0) {
            let filt_entries = [];
            let filt_meta = [];

            [filt_entries, filt_meta] = filters.filter_duplicate_numerics(this._entries, this._meta);

            const rand = Rand.range(filt_entries.length);
            const entry = filt_entries[rand];
            const meta = filt_meta[rand];

            let val: number;
            if (entry.type === Syntax.Literal)
                val = Number(entry.value);
            else if (entry.type === Syntax.UnaryExpression)
                val = Number(entry.operator.concat(entry.argument.value));
            else return super.code;

            if (isNaN(val))
                return super.code;

            val += this._gen();
            let patch = val.toString();

            return super.code.slice(0, meta.start.offset) +
                patch + super.code.slice(meta.end.offset);
        }

        return super.code;
    }
}
