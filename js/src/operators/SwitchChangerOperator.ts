import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


abstract class SwitchChangerOperator extends MutationOperator {
    private __switch_statements: Array<estree.SwitchStatement> = [];
    private __switch_statements_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this.__switch_statements = [];
        this.__switch_statements_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.SwitchStatement) {
                this.__switch_statements.push(node);
                this.__switch_statements_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected abstract _generate_patch(): string;

    
    protected get _switch_statements()
    { return this.__switch_statements.slice(); }

    protected get _switch_statements_meta()
    { return this.__switch_statements_meta.slice(); }
}


export class SwitchNestedCaseRemoverOperator extends SwitchChangerOperator {
    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let switch_statements = this._switch_statements.filter(value => { return super.node_id(value) === 0; });
        let switch_statements_meta = this._switch_statements_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (switch_statements.length > 0) {
            let index = Rand.range(switch_statements.length);
            let node = switch_statements[index];
            let meta = switch_statements_meta[index];

            let switch_cases = node.cases;

            let rand_indices: Array<number> = Rand.generate(switch_cases.length, Rand.range, switch_cases.length);
            let uniq_indices: Array<number> = Array.from(new Set(rand_indices));
            uniq_indices.sort((left, right) => right - left);

            let ss: number = meta.start.offset;
            let switch_code = this.node_code(node);

            // remove case-code slices from code
            let patch = switch_code;
            for (let ci of uniq_indices) {
                patch = patch.slice(0, switch_cases[ci].range?.[0] as number - ss) + 
                    patch.slice(switch_cases[ci].range?.[1] as number - ss);
            }

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


abstract class SwitchDefaultOperator extends SwitchChangerOperator {
    protected abstract _default(node: estree.SwitchStatement, metadata: any): string;


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let switch_statements = this._switch_statements.filter(value => { return super.node_id(value) === 0; });
        let switch_statements_meta = this._switch_statements_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (switch_statements.length > 0) {
            let index = Rand.range(switch_statements.length);
            let node = switch_statements[index];
            let meta = switch_statements_meta[index];

            let default_case = (): estree.SwitchCase | null => {
                for (let i = 0; i < node.cases.length; ++i) {
                    if (node.cases[i].test === null)
                        return node.cases[i];
                }

                return null;
            };

            if (default_case() !== null) {
                return super.cleaned_code
            }

            const patch = this._default(node, meta);

            return super.cleaned_code.slice(0, meta.end.offset - 1) +
                patch + super.cleaned_code.slice(meta.end.offset - 1);
        }

        return super.cleaned_code;
    }
}


export class SwitchDefaultReturnDiscriminantOperator extends SwitchDefaultOperator {
    protected _default(node: estree.SwitchStatement, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return "    default:\n" + ' '.repeat(indent) +
               "        return " + this.cleaned_code.substring(node.discriminant.range?.[0] as number, node.discriminant.range?.[1] as number) + ";\n" +
               ' '.repeat(indent);
    }
}


export class SwitchDefaultReturnNullOperator extends SwitchDefaultOperator {
    protected _default(node: estree.SwitchStatement, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return "    default:\n" + ' '.repeat(indent) +
               "        return null;\n" +
               ' '.repeat(indent);
    }
}


export class SwitchDefaultReturnUndefinedOperator extends SwitchDefaultOperator {
    protected _default(node: estree.SwitchStatement, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return "    default:\n" + ' '.repeat(indent) +
               "        return undefined;\n" +
               ' '.repeat(indent);
    }
}


export class SwitchDefaultThrowOperator extends SwitchDefaultOperator {
    protected _default(node: estree.SwitchStatement, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return "    default:\n" + ' '.repeat(indent) +
               "        throw Error('GenprogJS: automatically generated default throw');\n" +
               ' '.repeat(indent);
    }
}
