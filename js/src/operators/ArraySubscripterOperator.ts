import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { keep_between } from "./filters/filters";


abstract class ArraySubscripterOperator extends MutationOperator {
    private _computed_members: Array<estree.MemberExpression> = [];
    private _computed_members_meta: Array<any> = [];
    private _inners: Array<estree.Node> = [];
    private _inners_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._computed_members = [];
        this._computed_members_meta = [];
        this._inners = [];
        this._inners_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.MemberExpression &&
                node.computed && this._cleaned_code[metadata.end.offset - 1] === ']') {
                this._computed_members.push(node);
                this._computed_members_meta.push(metadata);
            }
            else {
                this._inners.push(node);
                this._inners_meta.push(metadata);
            }

            this.stash(node, metadata);
        }
    }


    protected abstract _subscripter(array_name: string, subscript: string): string;


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let computed_members = this._computed_members.filter(value => { return super.node_id(value) === 0; });
        let computed_members_meta = this._computed_members_meta.filter(value => { return super.node_id(value) === 0; });

        let inners = this._inners.filter(value => { return super.node_id(value) === 0; });
        let inners_meta = this._inners_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (computed_members.length > 0) {
            let change_index = Rand.range(computed_members.length);
            
            const selected_entry = computed_members[change_index];
            const selected_entry_meta: any = computed_members_meta[change_index];

            [inners, inners_meta] = keep_between(inners, inners_meta,
                selected_entry_meta.start.offset, selected_entry_meta.end.offset);

            const f = (nodes: Array<estree.Node>, meta: Array<any>): Array<Array<estree.Node> | Array<any>> => {
                let filt: Array<estree.Node> = [];
                let filt_meta: Array<any> = [];

                filt.length = 2;
                filt_meta.length = 2;

                for (let i = 0; i < inners.length; ++i) {
                    let data = inners[i];

                    if (data === selected_entry.object) {
                        filt[0] = data;
                        filt_meta[0] = inners_meta[i]
                    }
                    else if (data === selected_entry.property) {
                        filt[1] = data;
                        filt_meta[1] = inners_meta[i]
                    }
                }

                return [filt, filt_meta];
            }

            [inners, inners_meta] = f(inners, inners_meta);

            const patch = this._subscripter(super.node_code(inners[0]), super.node_code(inners[1]));

            return super.cleaned_code.slice(0, inners_meta[1].start.offset) +
                patch + super.cleaned_code.slice(inners_meta[1].end.offset);
        }

        return super.cleaned_code;
    }
}


export class ArraySubscriptCapOperator extends ArraySubscripterOperator {
    protected _subscripter(array_name: string, subscript: string): string {
        return `${subscript} >= 0 ? ${subscript} < ${array_name}.length ? ${subscript} : ${array_name}.length - 1 : 0`;
    }
}


export class ArraySubscriptRandOperator extends ArraySubscripterOperator {
    protected _subscripter(array_name: string, subscript: string): string {
        return `${subscript} < 0 || ${subscript} >= ${array_name}.length ? Math.floor(Math.random() * ${array_name}.length) : ${subscript}`;
    }
}


export class ArraySubscriptRemainderOperator extends ArraySubscripterOperator {
    protected _subscripter(array_name: string, subscript: string): string {
        return `${subscript} % ${array_name}.length`;
    }
}
