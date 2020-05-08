"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _op_classes = [
    require("../../operators/BinExprChangerOperator").BinExprChangerOperator,
    require("../../operators/CallChangerOperator").CallChangerOperator,
    require("../../operators/ConditionalChangerOperator").ConditionalChangerOperator,
    require("../../operators/ConditionalInverterOperator").ConditionalInverterOperator,
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
    require("../../operators/VarChangerOperator").VarChangerOperator,
	require("../../operators/TreeCrossoverOperator").TreeCrossoverOperator
];
let _op_table = {};
exports.ops = _op_table;
let run_once = true;
if (run_once) {
    _op_classes.forEach(value => {
        let name = value.name;
        _op_table[name] = value;
    });
    run_once = false;
}
