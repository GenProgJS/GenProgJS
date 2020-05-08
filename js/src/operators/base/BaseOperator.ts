import * as esprima from "esprima";
import { Program } from "esprima";
import { Node } from "estree";

import * as config from "../config/config.json";


export interface Operator {
    operate(): void;
    readonly buggy_line: number;
    readonly ast: Program | null;
    readonly code: string;
    readonly err: Error | null;
}

export interface MutationOperatorConstructible {
    new (code: string, buggy_line: number): Operator;
}

export interface CrossoverOperatorConstructible {
    new (code1: string, code2: string, buggy_line: number): Operator;
}


export abstract class BaseOperator implements Operator {
    protected _code: string = '';
    protected _buggy_line: number = 0;
    protected _err: Error | null = null;
    protected _ast: Program | null = null;


    protected abstract _init(): void;

    /**
     * @brief _operator - defines the behavior of the operator
     * @param node
     * @param metadata
     * @protected
     */
    protected abstract _operator(node: Node, metadata: any): void;

    protected abstract _generate_patch(): string;

    
    public operate(): void {
        // if there were no errors on construction
        // start parsing the code
        if (this._err === null) {
            this._init();

            // get the patched code
            const try_code = this._generate_patch();

            // see if patched code is, in fact a valid code
            // according to configurations
            try {
                this._ast = esprima.parseScript(try_code, config.esprima);
            } catch (err) {
                this._err = err;
            }

            // if the newly generated code was parsed successfully,
            // update the object's program code
            if (this._err === null)
                this._code = try_code;
        }
    }

    public get buggy_line(): number
    { return this._buggy_line; }
    public get ast(): Program | null
    { return this._ast; }
    /**
     * @brief code - gets the patched code after a successful operation
     * @returns {string}
     */
    public get code(): string
    { return this._code; }

    public get err(): Error | null
    { return this._err; }


    protected is_buggy_line(metadata: any, end_same_line: boolean = true): boolean {
        if (end_same_line) {
            return metadata.start.line === this.buggy_line &&
                metadata.end.line === this.buggy_line;
        }

        return metadata.start.line === this.buggy_line;
    }
}
