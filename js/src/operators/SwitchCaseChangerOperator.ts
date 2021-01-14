import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { extract, gencode } from "./gens";
import escodegen from "escodegen"
import lodash from "lodash";


abstract class SwitchCaseChangerOperator extends MutationOperator {
    protected _switch_cases: Array<estree.SwitchCase> = [];
    protected _switch_cases_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._switch_cases = [];
        this._switch_cases_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.SwitchCase) {
                this._switch_cases.push(node);
                this._switch_cases_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected abstract _generate_patch(): string;
}


abstract class SwitchCaseNonFallThroughOperator extends SwitchCaseChangerOperator {
    protected abstract _default(node: estree.SwitchCase, metadata: any): string;


    protected _ender(nodes: estree.Node[]): boolean {
        for (let node of nodes) {
            if (node.type === Syntax.ReturnStatement || node.type === Syntax.BreakStatement) {
                return true;
            }
        }

        return false;
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let switch_cases = this._switch_cases.filter(value => { return super.node_id(value) === 0; });
        let switch_cases_meta = this._switch_cases_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (switch_cases.length > 0) {
            let index = Rand.range(switch_cases.length);
            let node = switch_cases[index];
            let meta = switch_cases_meta[index];

            let statements = extract().from(node.consequent as unknown as estree.Node);
            let ender = this._ender(statements);

            if (!ender) {
                const patch = this._default(node, meta);

                return super.cleaned_code.slice(0, meta.end.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }

        return super.cleaned_code;
    }
}


abstract class SwitchCaseStrictNonFallThroughOperator extends SwitchCaseNonFallThroughOperator {
    protected _ender(nodes: estree.Node[]): boolean {
        if (nodes.length <= 0)
            return false;

        const last_node = nodes[nodes.length - 1];
        return last_node.type === Syntax.ReturnStatement || last_node.type === Syntax.BreakStatement;
    }
}


export class SwitchCaseRemoverOperator extends SwitchCaseChangerOperator {
    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let switch_cases = this._switch_cases.filter(value => { return super.node_id(value) === 0; });
        let switch_cases_meta = this._switch_cases_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (switch_cases.length > 0) {
            let index = Rand.range(switch_cases.length);
            let node = switch_cases[index];
            let meta = switch_cases_meta[index];


            return super.cleaned_code.slice(0, meta.start.offset) +
                super.cleaned_code.slice(meta.end.offset);

        }

        return super.cleaned_code;
    }
}


export class SwitchCaseFallthroughOperator extends SwitchCaseChangerOperator {
    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let switch_cases = this._switch_cases.filter(value => { return super.node_id(value) === 0; });
        let switch_cases_meta = this._switch_cases_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (switch_cases.length > 0) {
            let index = Rand.range(switch_cases.length);
            let node = switch_cases[index];
            let meta = switch_cases_meta[index];

            let statements = extract().from(node.consequent as unknown as estree.Node);
            let removeables: Array<estree.ReturnStatement | estree.BreakStatement> = [];
            for (let statement of statements) {
                if (statement.type === Syntax.ReturnStatement || statement.type === Syntax.BreakStatement) {
                    removeables.push(statement);
                }
            }

            if (removeables.length > 0) {
                let remove_indices = new Set(Rand.generate(removeables.length, Rand.range, removeables.length));
                removeables = removeables.filter((val, index) => remove_indices.has(index));

                removeables.map(val => lodash.assign(val, {type: Syntax.EmptyStatement}));

                const patch = gencode(escodegen, node);

                return super.cleaned_code.slice(0, meta.start.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }

        return super.cleaned_code;
    }
}


export class SwitchCaseBreakOperator extends SwitchCaseNonFallThroughOperator {
    protected _default(node: estree.SwitchCase, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return '\n' + ' '.repeat(indent) + "    break;";
    }
}


export class SwitchCaseReturnNullOperator extends SwitchCaseNonFallThroughOperator {
    protected _default(node: estree.SwitchCase, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return '\n' + ' '.repeat(indent) + "    return null;";
    }
}


export class SwitchCaseReturnUndefinedOperator extends SwitchCaseNonFallThroughOperator {
    protected _default(node: estree.SwitchCase, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return '\n' + ' '.repeat(indent) + "    return undefined;";
    }
}


export class SwitchCaseStrictBreakOperator extends SwitchCaseStrictNonFallThroughOperator {
    protected _default(node: estree.SwitchCase, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return '\n' + ' '.repeat(indent) + "    break;";
    }
}


export class SwitchCaseStrictReturnNullOperator extends SwitchCaseStrictNonFallThroughOperator {
    protected _default(node: estree.SwitchCase, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return '\n' + ' '.repeat(indent) + "    return null;";
    }
}


export class SwitchCaseStrictReturnUndefinedOperator extends SwitchCaseStrictNonFallThroughOperator {
    protected _default(node: estree.SwitchCase, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent === undefined) {
            indent = 0;
        }

        return '\n' + ' '.repeat(indent) + "    return undefined;";
    }
}
