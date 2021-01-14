import { Syntax } from "esprima";
import escodegen from "escodegen";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { filter_lower_orders } from "./filters/filters";
import { AwaitInserterOperator } from "./AwaitInserterOperator";
import { gencode } from "./gens"


export class AsyncFunctionOperator extends MutationOperator {
    private _entries: Array<estree.FunctionDeclaration> = [];
    private _entries_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._entries = [];
        this._entries_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.FunctionDeclaration && node.async) {
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
            let node = entries[index];
            let meta = entries_meta[index];

            const code_to_modify = gencode(escodegen, node);
            const line_num = code_to_modify.split('\n').length;
            const lines_to_modify = Array.from(new Set(Rand.generate(line_num - 2, Rand.range, 2, line_num)));

            let patch = code_to_modify;
            for (const line of lines_to_modify) {
                let await_inserter = new AwaitInserterOperator(patch, line);
                await_inserter.operate();
                patch = await_inserter.code;
            }

            return this.cleaned_code.slice(0, meta.start.offset) +
                patch + this._cleaned_code.slice(meta.end.offset);
        }        

        return super.cleaned_code;
    }
}
