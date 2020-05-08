import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";
import * as config from "./config/config.json";


export class VarChangerOperator extends MutationOperator {
    private _entries: Array<estree.Identifier | estree.MemberExpression> = [];
    private _entries_meta: Array<any> = [];
    private _members: Array<estree.MemberExpression> = [];
    private _members_meta: Array<any> = [];
    private _idents: Array<estree.Identifier> = [];
    private _idents_meta: Array<any> = [];    


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._entries = [];
        this._entries_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        super._init();
    }

    protected _operator(node: estree.Identifier | estree.MemberExpression, metadata: any): void {
        // save every variable name
        if (node.type === Syntax.MemberExpression) {
            let right = super.code[metadata.end.offset] === '(';

            if (!right) {
                if (config.exclude_member_calls) {
                    if (!node.computed) {
                        this._members.push(node);
                        this._members_meta.push(metadata);
                    }
                } else {
                    this._members.push(node);
                    this._members_meta.push(metadata);
                }
            }
        } else if (node.type === Syntax.Identifier) {
            let left = metadata.start.offset > 0 && super.code[metadata.start.offset - 1] === '.';
            let right = super.code[metadata.end.offset] === '.' || super.code[metadata.end.offset] === '(';

            if (!(left || right)) {
                this._idents.push(node);
                this._idents_meta.push(metadata);
            }
        }

        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata)) {
            if (node.type === Syntax.Identifier || node.type === Syntax.MemberExpression) {
                let right = super.code[metadata.end.offset] === '(';

                if (!right) {
                    this._entries.push(node);
                    this._entries_meta.push(metadata);
                }
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._entries.length > 0 && (this._members.length > 0 || this._idents.length > 0)) {
            let everyone: Array<estree.Identifier | estree.MemberExpression> = [];
            let everyone_meta: Array<any> = [];
            everyone = everyone.concat(this._idents).concat(this._members);
            everyone_meta = everyone_meta.concat(this._idents_meta).concat(this._members_meta);

            let entries = [], entries_meta = [];
            [entries, entries_meta] = filters.filter_lower_orders(this._entries, this._entries_meta);

            let change_index = Rand.range(entries.length);

            const selected_entry = entries[change_index];
            const selected_entry_meta = entries_meta[change_index];

            [everyone, everyone_meta] = filters.filter_by_offset(everyone, everyone_meta, selected_entry_meta,
                config.left_offset_threshold, config.right_offset_threshold);

            if (everyone.length > 0) {
                const substitute_index = Rand.range(everyone_meta.length);
                const substitute = everyone[substitute_index];
                const substitute_meta = everyone_meta[substitute_index];

                const patch = super.code.substring(substitute_meta.start.offset, substitute_meta.end.offset);

                return super.code.slice(0, selected_entry_meta.start.offset) +
                    patch + super.code.slice(selected_entry_meta.end.offset);
            }
        }

        return super.code;
    }
}
