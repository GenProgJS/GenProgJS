import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { isString } from "lodash";


abstract class StringChangerOperator extends MutationOperator {
    private _strings: Array<estree.Literal> = [];
    private _strings_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._strings = [];
        this._strings_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.Literal && isString(node.value)) {
                this._strings.push(node);
                this._strings_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected abstract _default(input: string): string;


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let strings = this._strings.filter(value => { return super.node_id(value) === 0; });
        let strings_meta = this._strings_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (strings.length > 0) {
            let index = Rand.range(strings.length);
            let node = strings[index];
            let meta = strings_meta[index];

            const patch = this._default(node.value as string);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


export class StringRemoverOperator extends StringChangerOperator {
    protected _default(input: string): string {
        return "''";
    }
}


export class StringToLowerCaseOperator extends StringChangerOperator {
    protected _default(input: string): string {
        return "'" + input.toLowerCase() + "'";
    }
}


export class StringToUpperCaseOperator extends StringChangerOperator {
    protected _default(input: string): string {
        return "'" + input.toUpperCase() + "'";
    }
}


export class StringPartitionOperator extends StringChangerOperator {
    protected _default(input: string): string {
        return "'" + input.substring(Rand.range(input.length), Rand.range(input.length)) + "'";
    }
}


export class StringCutOperator extends StringChangerOperator {
    protected _default(input: string): string {
        const cut = input.substring(Rand.range(input.length), Rand.range(input.length));
        return "'" + input.replace(cut, '') + "'";
    }
}
