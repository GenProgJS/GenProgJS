import { Syntax } from "esprima";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import * as filters from "./filters/filters";
import * as config from "./config/config.json"


const remove_probability = 0.7;
const append_probability = 0.3;

type allowed_node_t = estree.CallExpression &
    estree.Literal &
    estree.MemberExpression &
    estree.Identifier &
    estree.UnaryExpression;


export class CallChangerOperator extends MutationOperator {
    private static _config = config;

    private _calls: Array<estree.CallExpression> = [];
    private _calls_meta: Array<any> = [];
    private _literals: Array<estree.Literal> = [];
    private _literals_meta: Array<any> = [];
    private _members: Array<estree.MemberExpression> = [];
    private _members_meta: Array<any> = [];
    private _idents: Array<estree.Identifier> = [];
    private _idents_meta: Array<any> = [];
    

    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }

    protected _init(): void {
        this._calls = [];
        this._calls_meta = [];
        this._literals = [];
        this._literals_meta = [];
        this._members = [];
        this._members_meta = [];
        this._idents = [];
        this._idents_meta = [];
        super._init();
    }

    protected _operator (node: allowed_node_t, metadata: any): void {
        // save every variable name
        if (node.type === Syntax.Literal || (node.type === Syntax.UnaryExpression &&
            node.operator === '-' && node.prefix === true)) {
            this._literals.push(node);
            this._literals_meta.push(metadata);
        } else if (node.type === Syntax.MemberExpression) {
            let right = super.code[metadata.end.offset] === '(';

            if (!right) {
                if (CallChangerOperator._config.exclude_member_calls) {
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

        // get call expressions from the buggy line
        if (this.is_buggy_line(metadata)) {
            if (node.type === Syntax.CallExpression) {
                this._calls.push(node);
                this._calls_meta.push(metadata);
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._calls.length > 0 && (this._members.length > 0 || this._idents.length > 0)) {
            let filt_literals: Array<estree.Node> | Array<any>;
            let filt_literals_meta: Array<any>;

            [filt_literals, filt_literals_meta] = filters.filter_duplicate_numerics(this._literals, this._literals_meta);

            let everyone: Array<estree.Node> = [], everyone_meta: Array<any> = [];
            everyone = everyone.concat(this._idents).concat(this._members).concat(filt_literals);
            everyone_meta = this._idents_meta.concat(this._members_meta).concat(filt_literals_meta);

            let callee_index = Rand.range(this._calls.length);

            let selected_call = this._calls[callee_index];
            let selected_call_meta = this._calls_meta[callee_index];
            let args = [];
            let args_meta = [];
            for (let i = 0; i < everyone_meta.length; ++i) {
                if (everyone_meta[i].start.offset > selected_call_meta.start.offset &&
                    everyone_meta[i].end.offset < selected_call_meta.end.offset) {
                    args.push(everyone[i]);
                    args_meta.push((everyone_meta[i]));
                }
            }
            [args, args_meta] = filters.filter_lower_orders(args, args_meta);

            [everyone, everyone_meta] = filters.filter_by_offset(everyone, everyone_meta,
                selected_call_meta, CallChangerOperator._config.left_offset_threshold, CallChangerOperator._config.right_offset_threshold);

            let append = Math.random() < append_probability ? 1 : 0;
            let remove = Math.random() < remove_probability ? 1 : 0;


            // signal for parameter change
            if (!(append ^ remove) && args.length && everyone.length) {
                // choose an argument to change
                let change_index = Rand.range(args.length);
                // choose an identifier from the list
                let new_identifier_index = Rand.range(everyone.length);
                let new_identifier = everyone[new_identifier_index];
                let new_metadata = everyone_meta[new_identifier_index];

                // get metadata of the chosen argument
                let changeling_meta = args_meta[change_index];

                // generate patch
                let patch = super.code.slice(new_metadata.start.offset, new_metadata.end.offset);

                // insert patch into unmodified code
                return super.code.slice(0, changeling_meta.start.offset) +
                    patch + super.code.slice(changeling_meta.end.offset);
            }
            // signal for removing argument
            else if (remove && args.length) {
                // choose an argument to remove
                let remove_index = Rand.range(args.length);
                let removable_meta = args_meta[remove_index];

                // if the there is just one call argument, then
                // no post processing is needed
                if (args.length === 1) {
                    return super.code.slice(0, removable_meta.start.offset) +
                        super.code.slice(removable_meta.end.offset);
                }
                // if we want to remove the last argument
                else if (remove_index === args.length - 1) {
                    // find previous argument's offset
                    let prev_meta = args_meta[remove_index - 1];

                    return super.code.slice(0, prev_meta.end.offset) +
                        super.code.slice(removable_meta.end.offset);
                }
                else {
                    // find the next argument's offset
                    let next_meta = args_meta[remove_index + 1];

                    return super.code.slice(0, removable_meta.start.offset) +
                        super.code.slice(next_meta.start.offset);
                }
            }
            // signal for appending an argument to the function call
            else if (everyone.length > 0) {
                // choose an index for the new argument
                let push_index = Rand.range(args.length + 1);

                // choose an identifier from the list
                let new_identifier_index = Rand.range(everyone.length);
                let new_identifier = everyone[new_identifier_index];
                let new_metadata = everyone_meta[new_identifier_index];

                // if there are no arguments, generate one
                if (args.length <= 0) {
                    let patch = super.code.slice(new_metadata.start.offset, new_metadata.end.offset);

                    return super.code.slice(0, selected_call_meta.end.offset - 1) +
                        patch + super.code.slice(selected_call_meta.end.offset - 1);
                }
                // if there are call arguments
                // there will be two separate cases
                else {
                    // push after the last argument
                    if (push_index === args.length) {
                        // generate patch
                        let patch = ", " + super.code.slice(new_metadata.start.offset, new_metadata.end.offset);

                        return super.code.slice(0, selected_call_meta.end.offset - 1) +
                            patch + super.code.slice(selected_call_meta.end.offset - 1);
                    }
                    // insert before a chosen argument
                    else {
                        let changeling_meta = args_meta[push_index];

                        // generate patch
                        let patch = super.code.slice(new_metadata.start.offset, new_metadata.end.offset) + ", ";

                        return super.code.slice(0, changeling_meta.start.offset) +
                            patch + super.code.slice(changeling_meta.start.offset);
                    }
                }
            }
        }

        return super.code;
    }
}
