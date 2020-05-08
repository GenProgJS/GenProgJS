import estree from "estree";
import { Syntax } from "esprima";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";


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

    protected _operator(node: estree.IfStatement, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.IfStatement) {
                this._conditionals.push(node);
                this._conditionals_meta.push(metadata);
                this._test_range.push(node.test.range);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._conditionals.length > 0) {
            const if_index = Rand.range(this._test_range.length);
            const range_if = this._test_range[if_index];

            let patch = "!(" + super.code.slice(range_if[0], range_if[1]) + ')';

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

            return super.code.slice(0, range_if[0]) +
                patch + super.code.slice(range_if[1]);
        }

        return super.code;
    }
}
