import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";


export class NullCheckOperator extends MutationOperator {
    private _calls: Array<estree.CallExpression> = [];
    private _calls_meta: Array<any> = [];
    private _unaries: Array<estree.UnaryExpression> = [];
    private _unaries_meta: Array<any> = [];
    private _members: Array<estree.MemberExpression> = [];
    private _members_meta: Array<any> = [];
    private _idents: Array<estree.Identifier> = [];
    private _idents_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._calls = [];
        this._calls_meta = [];
        this._unaries = [];
        this._unaries_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata)) {
            if (node.type === Syntax.MemberExpression) {
                this._members.push(node);
                this._members_meta.push(metadata);
            } else if (node.type === Syntax.CallExpression) {
                this._calls.push(node);
                this._calls_meta.push(metadata);
            } else if (node.type === Syntax.Identifier) {
                let left = metadata.start.offset > 0 && super.code[metadata.start.offset - 1] === '.';
                let right = super.code[metadata.end.offset] === '.' || super.code[metadata.end.offset] === '(';

                if (!(left || right)) {
                    this._idents.push(node);
                    this._idents_meta.push(metadata);
                }
            } else if (node.type === Syntax.UnaryExpression) {
                this._unaries.push(node);
                this._unaries_meta.push(metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._members.length > 0 ||
            this._idents.length > 0 ||
            this._unaries.length > 0 ||
            this._calls.length > 0) {

            let everyone: Array<estree.Node> = [];
            let everyone_meta: Array<any> = [];
            everyone = everyone.concat(this._idents).concat(this._members)
                .concat(this._unaries).concat(this._calls);
            everyone_meta = everyone_meta.concat(this._idents_meta).concat(this._members_meta)
                .concat(this._unaries_meta).concat(this._calls_meta);

            [everyone, everyone_meta] = filters.filter_lower_orders(everyone, everyone_meta);

            if (everyone.length > 0) {
                let rand = Rand.range(0, everyone.length);
                const node = everyone[rand];
                const meta = everyone_meta[rand];

                let patch = super.code.slice(meta.start.offset, meta.end.offset);

                patch += " && ";
                patch = Math.random() < 0.5 ? patch : '!' + patch;

                // kill generated redundant logical negates
                if (patch.indexOf('!!', 0) === 0) {
                    patch = patch.slice(2, patch.length);
                }

                // insert before
                return super.code.slice(0, meta.start.offset) +
                    patch + super.code.slice(meta.start.offset);
            }
        }

        return super.code;
    }
}
