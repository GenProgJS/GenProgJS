import { MutationOperatorConstructible, CrossoverOperatorConstructible } from "../../operators/base/BaseOperator";

const _op_classes: Array<MutationOperatorConstructible | CrossoverOperatorConstructible> = [
    require("../../operators/CallChangerOperator").CallChangerOperator,
    require("../../operators/ConditionalChangerOperator").ConditionalChangerOperator,
    require("../../operators/ConditionalInverterOperator").ConditionalInverterOperator,
    require("../../operators/ConditionalTypeChangerOperator").ConditionalTypeChangerOperator,
    require("../../operators/ExprReplacerOperator").ExprReplacerOperator,
    require("../../operators/ExprStatementChangerOperator").ExprStatementChangerOperator,
    require("../../operators/ExprStatementInserterOperator").ExprStatementInserterOperator,
    require("../../operators/ExprStatementRemoverOperator").ExprStatementRemoverOperator,
    require("../../operators/LogicalExprChangerOperator").LogicalExprChangerOperator,
    require("../../operators/MutExprStatementChangerOperator").MutExprStatementChangerOperator,
    require("../../operators/MutExprStatementInserterOperator").MutExprStatementInserterOperator,
    require("../../operators/NullCheckOperator").NullCheckOperator,
    require("../../operators/NumberChangerOperator").NumberChangerOperator,
    require("../../operators/ReturnInsertOperator").ReturnInsertOperator,
    require("../../operators/TreeCrossoverOperator").TreeCrossoverOperator,
    require("../../operators/VarChangerOperator").VarChangerOperator    
]

let _op_table: { [key: string]: MutationOperatorConstructible | CrossoverOperatorConstructible } = {};

let run_once: boolean = true;
if (run_once) {
    _op_classes.forEach(value => {
        let name: string = value.name;
        _op_table[name] = value;
    });
    run_once = false;
}

export {_op_table as ops};