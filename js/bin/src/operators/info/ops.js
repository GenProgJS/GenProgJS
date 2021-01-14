"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseOperator_1 = require("../../operators/base/BaseOperator");
const rand_1 = require("../../random/rand");
const _op_table = Object.assign(function (key) {
    let exported_class_dict = _op_table[key];
    for (const key in exported_class_dict) {
        if (!(exported_class_dict[key].prototype instanceof BaseOperator_1.BaseOperator)) {
            delete exported_class_dict[key];
        }
    }
    const exported_class_names = Object.keys(exported_class_dict);
    const class_name = exported_class_names[rand_1.Rand.range(exported_class_names.length)];
    const cls = exported_class_dict[class_name];
    return cls;
}, {
    ArithmeticBinaryOperatorChanger: require("../../operators/ArithmeticBinaryOperatorChanger"),
    ArraySubscripterOperator: require("../../operators/ArraySubscripterOperator"),
    AsyncFunctionOperator: require("../../operators/AsyncFunctionOperator"),
    AwaitInserterOperator: require("../../operators/AwaitInserterOperator"),
    BinaryOperatorChanger: require("../../operators/BinaryOperatorChanger"),
    BitwiseBinaryOperatorChanger: require("../../operators/BitwiseBinaryOperatorChanger"),
    CallChangerOperator: require("../../operators/CallChangerOperator"),
    ConditionalBinaryOperatorChanger: require("../../operators/ConditionalBinaryOperatorChanger"),
    ConditionalChangerOperator: require("../../operators/ConditionalChangerOperator"),
    DeclarationChangerOperator: require("../../operators/DeclarationChangerOperator"),
    EvalMutationOperator: require("../../operators/EvalMutationOperator"),
    ExprReplacerOperator: require("../../operators/ExprReplacerOperator"),
    ExprStatementChangerOperator: require("../../operators/ExprStatementChangerOperator"),
    ExprStatementInserterOperator: require("../../operators/ExprStatementInserterOperator"),
    ExprStatementRemoverOperator: require("../../operators/ExprStatementRemoverOperator"),
    FunctionCallRemoverOperator: require("../../operators/FunctionCallRemoverOperator"),
    FunctionMakerOperator: require("../../operators/FunctionMakerOperator"),
    IfElseChangerOperator: require("../../operators/IfElseChangerOperator"),
    LogicalExprChangerOperator: require("../../operators/LogicalExprChangerOperator"),
    LoopFixOperator: require("../../operators/LoopFixOperator"),
    MutExprStatementChangerOperator: require("../../operators/MutExprStatementChangerOperator"),
    MutExprStatementInserterOperator: require("../../operators/MutExprStatementInserterOperator"),
    NullCheckOperator: require("../../operators/NullCheckOperator"),
    NumberChangerOperator: require("../../operators/NumberChangerOperator"),
    ReturnInsertOperator: require("../../operators/ReturnInsertOperator"),
    ReturnNoneOperator: require("../../operators/ReturnNoneOperator"),
    ShiftOperatorChanger: require("../../operators/ShiftOperatorChanger"),
    StringChangerOperator: require("../../operators/StringChangerOperator"),
    SwitchCaseChangerOperator: require("../../operators/SwitchCaseChangerOperator"),
    SwitchChangerOperator: require("../../operators/SwitchChangerOperator"),
    TernaryChangerOperator: require("../../operators/TernaryChangerOperator"),
    TreeCrossoverOperator: require("../../operators/TreeCrossoverOperator"),
    TryCatcherOperator: require("../../operators/TryCatcherOperator"),
    UpdateExpressionChangerOperator: require("../../operators/UpdateExpressionChangerOperator"),
    VarChangerOperator: require("../../operators/VarChangerOperator")
});
exports.ops = _op_table;
