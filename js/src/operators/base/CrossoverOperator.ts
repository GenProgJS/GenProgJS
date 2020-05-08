import * as esprima from "esprima";
import { Program } from "esprima";
import lodash from "lodash"

import * as config from "../config/config.json";
import { BaseOperator } from "./BaseOperator"


export abstract class CrossoverOperator extends BaseOperator {
    protected _code1: string;
    protected _code2: string;
    protected _ast1: Program | null;
    protected _ast2: Program | null;
    private _n_op: number;    


    public constructor(code1: string, code2: string, buggy_line: number) {
        super()
        this._code = code1;
        this._buggy_line = buggy_line;
        this._err = null;
        this._ast = null;

        this._ast1 = null;
        this._ast2 = null;
        this._code1 = code1;
        this._code2 = code2;

        this._n_op = 0;

        if (!code1 || !code2 || !buggy_line)
            this._err = TypeError("ERROR: at least one program is undefined or buggy_line not specified");
        else if ((code1.match(/\n/g) || '').length + 1 < buggy_line || (code2.match(/\n/g) || '').length + 1 < buggy_line)
            this._err = RangeError("ERROR: buggy line greater, than lines in code");

        if (buggy_line <= 0)
            this._err = RangeError("WARNING: no bugs specified in code; line = " + buggy_line.toString());

        if (this._err)
            return;

        try {
            this._ast1 = esprima.parseScript(code1, config.esprima);
            this._ast2 = esprima.parseScript(code2, config.esprima);

            this._ast = lodash.cloneDeep(this._ast1);
        } catch (err) {
            this._err = err;
        }
    }

    protected _init(): void {
        this._n_op = 0;
        this._ast1 = esprima.parseScript(
            this._code1,
            config.esprima,
            this._operator.bind(this)
        );
        this._n_op = 1;
        this._ast2 = esprima.parseScript(
            this._code2,
            config.esprima,
            this._operator.bind(this)
        );
    }

    protected get n(): number {
        return this._n_op;
    }
}
