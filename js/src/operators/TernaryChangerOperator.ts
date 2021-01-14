import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { gencode, extract } from "./gens";
import escodegen from "escodegen";
import lodash from "lodash";
import { filter_lower_orders } from "./filters/filters";


abstract class TernaryChangerOperator extends MutationOperator {
    private _ternaries: Array<estree.ConditionalExpression> = [];
    private _ternaries_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._ternaries = [];
        this._ternaries_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.ConditionalExpression) {
                this._ternaries.push(node);
                this._ternaries_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected abstract _default(ternaries: estree.ConditionalExpression[], ternaries_meta: any[]): [string, any];


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let ternaries = this._ternaries.filter(value => { return super.node_id(value) === 0; });
        let ternaires_meta = this._ternaries_meta.filter(value => { return super.node_id(value) === 0; });
        

        if (ternaries.length > 0) {
            let patch: string;
            let meta: any;
            [patch, meta] = this._default(ternaries, ternaires_meta);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


export class TernaryExchangeOperator extends TernaryChangerOperator {
    protected _default(ternaries: estree.ConditionalExpression[], ternaries_meta: any[]): [string, any] {
        const index = Rand.range(ternaries.length);
        const node = ternaries[index];
        const meta = ternaries_meta[index];

        const alternate = lodash.cloneDeep(node.alternate);
        const consequent = lodash.cloneDeep(node.consequent);

        lodash.assign(node.alternate, consequent);
        lodash.assign(node.consequent, alternate);

        let patch = gencode(escodegen, node);

        return [patch, meta];
    }
}


export class TernaryToIfElseFunctionCallOperator extends TernaryChangerOperator {
    protected _default(ternaries: estree.ConditionalExpression[], ternaries_meta: any[]): [string, any] {
        [ternaries, ternaries_meta] = filter_lower_orders(ternaries, ternaries_meta);
        const index = Rand.range(ternaries.length);
        const node = ternaries[index];
        const meta = ternaries_meta[index];
        const esprima = require("esprima");
        
        const if_elser = (node: estree.ConditionalExpression): string => {
            let if_else = '';

            do {
                const test = gencode(escodegen, node.test);
                const consequent = gencode(escodegen, node.consequent);

                // see if consequent contains a ternary op., too
                let ast: estree.Node = esprima.parseScript(consequent);
                let nested_ternary = extract(Syntax.ConditionalExpression).from(ast)[0] as estree.ConditionalExpression;
                
                if_else += `if (${test}) { `;
                if (nested_ternary) {
                    if_else += if_elser(nested_ternary);
                }
                else {
                    if_else += `return ${consequent};`;
                }
                if_else += " } else ";
                
                node = node.alternate as estree.ConditionalExpression;
            }
            while (node.type === Syntax.ConditionalExpression);
            if_else += `{ return ${gencode(escodegen, node)}; }`

            return if_else;
        }

        const if_else = if_elser(node);

        let patch = `function() { ${if_else} }()`;

        return [patch, meta];
    }
}
