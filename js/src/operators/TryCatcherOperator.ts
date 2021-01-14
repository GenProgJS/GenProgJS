import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


const check_condition = (node: estree.Node): boolean =>
    node.type === Syntax.IfStatement ||
    node.type === Syntax.ForStatement ||
    node.type === Syntax.ForInStatement ||
    node.type === Syntax.ForOfStatement ||
    node.type === Syntax.ThrowStatement ||
    node.type === Syntax.WhileStatement ||
    node.type === Syntax.DoWhileStatement ||
    node.type === Syntax.SwitchStatement ||
    node.type === Syntax.ReturnStatement ||
    node.type === Syntax.ExpressionStatement


export class TryCatcherOperator extends MutationOperator {
    private _entries: Array<estree.Statement> = [];
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
            if (check_condition(node)) {
                this._entries.push(node as estree.Statement);
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

            let indent = node.loc?.start.column as number;
            if (indent === null || indent === undefined)
                indent = 0;

            // get proper indetation for code
            let node_code_lines = this.node_code(node).split('\n');
            node_code_lines.forEach((value, index) => {
                node_code_lines[index] = ' '.repeat(indent + 4) + value;
            });
            let node_code = node_code_lines.join('\n');

            const patch = 
                "try {\n" + 
                ' '.repeat(indent) + node_code + "\n" +
                ' '.repeat(indent) + "}\n" +
                ' '.repeat(indent) + "catch (err) {\n" +
                ' '.repeat(indent + 4) + "console.log('GenprogJS generated, automatic error catch :: ' + err);\n" +
                ' '.repeat(indent) + "}\n";

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);

        }

        return super.cleaned_code;
    }
}
