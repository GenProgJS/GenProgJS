import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";
import * as config from "./config/config.json";


export class VarChangerOperator extends MutationOperator {
    private _entries: Array<estree.Identifier | estree.MemberExpression | estree.CallExpression> = [];
    private _entries_meta: Array<any> = [];
    private _members: Array<estree.MemberExpression> = [];
    private _members_meta: Array<any> = [];
    private _idents: Array<estree.Identifier> = [];
    private _idents_meta: Array<any> = [];
    private _calls: Array<estree.CallExpression> = [];
    private _calls_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._entries = [];
        this._entries_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        this._calls = [];
        this._calls_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        const cond = node.type === Syntax.Identifier ||
                     node.type === Syntax.MemberExpression ||
                     node.type === Syntax.CallExpression
        
        // save every variable name
        if (node.type === Syntax.MemberExpression) {
            this._members.push(node);
            this._members_meta.push(metadata);
        }
        else if (node.type === Syntax.Identifier) {
            this._idents.push(node);
            this._idents_meta.push(metadata);
        }
        else if (node.type === Syntax.CallExpression) {
            this._calls.push(node);
            this._calls_meta.push(metadata);
        }

        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.Identifier ||
                node.type === Syntax.MemberExpression ||
                node.type === Syntax.CallExpression) {
                this._entries.push(node);
                this._entries_meta.push(metadata);
            }
        }

        if (cond) this.stash(node, metadata);
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        // select a member to change in code
        let entries = [], entries_meta = [];
        [entries, entries_meta] = filters.filter_expr_type(this._entries, this._entries_meta, [Syntax.Identifier, Syntax.MemberExpression]);

        entries = entries.filter(value => { return super.node_id(value) === 0; });
        entries_meta = entries_meta.filter(value => { return super.node_id(value) === 0; });

        if (entries.length > 0 && (this._members.length > 0 || this._idents.length > 0)) {
            let everyone: Array<estree.Identifier | estree.MemberExpression | estree.CallExpression> = [];
            let everyone_meta: Array<any> = [];
            everyone = everyone.concat(this._idents).concat(this._members).concat(this._calls);
            everyone_meta = everyone_meta.concat(this._idents_meta).concat(this._members_meta).concat(this._calls_meta);

            let change_index = Rand.range(entries.length);
            
            const selected_entry = entries[change_index];
            const selected_entry_meta: any = entries_meta[change_index];

            [everyone, everyone_meta] = filters.filter_by_offset(everyone, everyone_meta, selected_entry_meta,
                config.left_offset_threshold, config.right_offset_threshold);

            [everyone, everyone_meta] = filters.filter_expr_type(everyone, everyone_meta, [Syntax.Identifier, Syntax.MemberExpression]);
            [everyone, everyone_meta] = filters.remove_duplicates(everyone, everyone_meta);

            if (everyone.length > 0) {
                const substitute_index = Rand.range(everyone_meta.length);
                const substitute = everyone[substitute_index];
                const substitute_meta = everyone_meta[substitute_index];

                const patch = super.node_code(substitute);

                return super.cleaned_code.slice(0, selected_entry_meta.start.offset) +
                    patch + super.cleaned_code.slice(selected_entry_meta.end.offset);
            }
        }

        return super.cleaned_code;
    }
}
