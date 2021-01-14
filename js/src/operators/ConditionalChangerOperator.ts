import { Syntax } from "esprima";
import estree from "estree";
import escodegen from "escodegen";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { extract, gencode } from "./gens";
import lodash from "lodash";


export class ConditionalChangerOperator extends MutationOperator {
    private _conditionals: Array<estree.IfStatement> = [];
    private _conditionals_meta: Array<any> = [];
    private _test_range: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._conditionals = [];
        this._conditionals_meta = [];
        this._test_range = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);
                this._test_range.push(node.test.range);

                this.stash(node, metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let conditionals: Array<estree.IfStatement> = [];
        let conditionals_meta: Array<any> = [];
        let test_range: Array<any> = [];
        for (let i = 0; i < this._conditionals.length; ++i) {
            if (super.node_id(this._conditionals[i]) === 0) {
                conditionals.push(this._conditionals[i]);
                conditionals_meta.push(this._conditionals_meta[i]);
                test_range.push(this._test_range[i]);
            }
        }
        

        if (conditionals.length > 0) {
            const patch = Math.random() < 0.5 ? "false" : "true";

            const if_index = Rand.range(test_range.length);
            const range_inf = test_range[if_index];

            return super.cleaned_code.slice(0, range_inf[0]) +
                patch + super.cleaned_code.slice(range_inf[1]);
        }

        return super.cleaned_code;
    }
}


export class ConditionalInverterOperator extends MutationOperator {
    private _conditionals: Array<estree.IfStatement> = [];
    private _conditionals_meta: Array<any> = [];
    private _test_range: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._conditionals = [];
        this._conditionals_meta = [];
        this._test_range = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);
                const artifical_meta = { start: { offset: node.test.range?.[0] }, end: { offset: node.test.range?.[1] } };
                this._test_range.push(artifical_meta);

                this.stash(node, metadata);
                this.stash(node.test, artifical_meta)
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let test_range = this._test_range.filter(value => { return super.node_id(value) === 0; });

        if (this._conditionals.length > 0 && test_range.length > 0) {
            const if_index = Rand.range(test_range.length);
            const range_if = test_range[if_index];

            let patch = "!(" + this.node_code(this._test_range[Rand.range(this._test_range.length)]) + ')';

            // kill generated redundancies
            if (patch.indexOf("!(!(", 0) === 0) {
                // slice off supposed first "!(!(" and last "))" part of the string
                let try_patch = patch.slice(4, -2);
                let temp = try_patch;

                let count = 0;
                let fail = false;
                // continue until we can find either '(' or ')' character
                const search_regex = /[()]/;
                for (let i = temp.search(search_regex); i >= 0; i = temp.search(search_regex)) {
                    // save the found character
                    let character = temp[i];
                    // slice off the first part of the string, after the found character
                    temp = temp.slice(i + 1);

                    // if the character is a closing parenthesis
                    // we decrease the count variable by one
                    if (character === ')') {
                        --count;

                        // if the counting goes below zero
                        // then, there is no redundant parts
                        // in the patch
                        if (count < 0) {
                            fail = true;
                            break;
                        }
                    }
                    else ++count;
                }

                // if the counting is not zero
                // then, the trimmed patch is discarded
                if (count !== 0)
                    fail = true;

                // discard the new patch if needed
                if (!fail)
                    patch = try_patch;
            }

            return super.cleaned_code.slice(0, range_if.start.offset) +
                patch + super.cleaned_code.slice(range_if.end.offset);
        }

        return super.cleaned_code;
    }
}


export class ConditionalRemoverOperator extends MutationOperator {
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

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let conditionals = this._conditionals.filter(value => { return super.node_id(value) === 0; });
        let conditionals_meta = this._conditionals_meta.filter(value => { return super.node_id(value) === 0; });

        if (conditionals.length > 0) {
            const index = Rand.range(conditionals.length);
            const node = conditionals[index];
            const meta = conditionals_meta[index];
            let logicals = extract(Syntax.LogicalExpression).from(node.test) as estree.LogicalExpression[];

            if (logicals.length > 0) {
                const l_index = Rand.range(logicals.length);
                const l_node = logicals[l_index];
                const l_meta = logicals[l_index];

                const test_range_left = node.test.range?.[0] as number;
                const test_range_right = node.test.range?.[1] as number;
                lodash.assign(l_node, Math.random() < 0.5 ? l_node.left : l_node.right);

                const patch = gencode(escodegen, node.test);

                return super.cleaned_code.slice(0, test_range_left) +
                    patch + super.cleaned_code.slice(test_range_right);
            }
        }

        return super.cleaned_code;
    }
}
