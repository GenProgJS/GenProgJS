import * as esprima from "esprima";
import { Program } from "esprima";

import * as config from "../config/config.json";
import { BaseOperator } from "./BaseOperator"


export abstract class MutationOperator extends BaseOperator {
    public constructor(code: string, buggy_line: number) {
        super()
        this._code = code;
        this._buggy_line = buggy_line;
        this._err = null;
        this._ast = null;

        if (!code || !buggy_line)
            this._err = TypeError("ERROR: undefined program or buggy_line");
        else if ((code.match(/\n/g) || '').length + 1 < buggy_line)
            this._err = RangeError("ERROR: buggy line greater, than lines in code");

        if (buggy_line <= 0)
            this._err = RangeError("WARNING: no bugs specified in code; line = " + buggy_line.toString());

        if (this._err)
            return;

        try {
            this._ast = esprima.parseScript(this._code, config.esprima);
        } catch (err) {
            this._err = err;
        }
    }

    protected _init(): void {
        this._ast = esprima.parseScript(
            this._code,
            config.esprima,
            this._operator.bind(this)
        );
    }
}
