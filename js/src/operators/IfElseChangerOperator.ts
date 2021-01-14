import { Syntax } from "esprima";
import estree from "estree";
import escodegen from "escodegen";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { gencode } from "./gens";
import lodash from "lodash";


abstract class IfElseChangerOperator extends MutationOperator {
    private _conditionals: Array<estree.IfStatement> = [];
    private _conditionals_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._conditionals = [];
        this._conditionals_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }

    protected abstract _patch(conditionals: Array<estree.IfStatement>, conditionals_meta: Array<any>): string;

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let conditionals: Array<estree.IfStatement> = this._conditionals.filter(value => { return super.node_id(value) === 0; });
        let conditionals_meta: Array<any> = this._conditionals_meta.filter(value => { return super.node_id(value) === 0; });

        if (conditionals.length > 0) {
            const patch = this._patch(conditionals, conditionals_meta);

            return patch;
        }

        return super.cleaned_code;
    }
}


export class RemoveIfNodesOperator extends IfElseChangerOperator {
    protected _removeable_alternates(conditional: estree.IfStatement): Array<estree.Node> {
        let removeable: estree.Node[] = [];

        let current: any = conditional;
        do {
            if (Math.random() < 0.5) {
                removeable.push(current);
            }
        } while ((current = current.alternate) != null);

        return removeable;
    }

    protected _patch(conditionals: Array<estree.IfStatement>, conditionals_meta: Array<any>): string {
        const index = Rand.range(conditionals.length);
        const node = conditionals[index];
        const meta = conditionals_meta[index];

        let removeables = this._removeable_alternates(node);
        let current: any = node;
        let build = lodash.cloneDeep(node);
        let current_build = build;

        let runs = 0;
        do {
            if (!removeables.includes(current)) {
                lodash.assign(current_build, current);
                current_build = current_build.alternate as estree.IfStatement;
                ++runs;
            }
            else {
                lodash.assign(current_build, current.consequent);
            }
        } while((current = current.alternate) != null);
        

        let trimmed_if: string;
        if (runs === 0 || build == null) {
            trimmed_if = '';
        }
        else {
            trimmed_if = gencode(escodegen, build);
        }

        return this.cleaned_code.slice(0, meta.start.offset) +
            trimmed_if + this.cleaned_code.slice(meta.end.offset);
    }
}


export class LastElseIfToElseOperator extends IfElseChangerOperator {
    protected _patch(conditionals: Array<estree.IfStatement>, conditionals_meta: Array<any>): string {
        const index = Rand.range(conditionals.length);
        const node = conditionals[index];
        const meta = conditionals_meta[index];

        let last: any = node;
        while (last.alternate != null) {
            last = last.alternate;
        }

        lodash.assign(last, last.consequent);
        let trimmed_if = gencode(escodegen, node);

        return this.cleaned_code.slice(0, meta.start.offset) +
            trimmed_if + this.cleaned_code.slice(meta.end.offset);
    }
}
