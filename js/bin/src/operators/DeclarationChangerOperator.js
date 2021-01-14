"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const escodegen_1 = __importDefault(require("escodegen"));
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const gens_1 = require("./gens");
class DeclarationChangerOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._declarations = [];
        this._declarations_meta = [];
    }
    _init() {
        this._declarations = [];
        this._declarations_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.VariableDeclaration) {
                this._declarations.push(node);
                this._declarations_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let declarations = this._declarations.filter(value => { return super.node_id(value) === 0; });
        let declarations_meta = this._declarations_meta.filter(value => { return super.node_id(value) === 0; });
        if (declarations.length > 0) {
            const index = rand_1.Rand.range(declarations.length);
            const node = declarations[index];
            const meta = declarations_meta[index];
            const patch = this._patch(node, meta);
            return this.cleaned_code.slice(0, meta.start.offset) +
                patch + this.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
class DeclarationTypeChangerOperator extends DeclarationChangerOperator {
    _is_valid_const(declaration) {
        for (const declarator of declaration.declarations) {
            if (declarator.init == null)
                return false;
        }
        return true;
    }
    _patch(declaration, declaration_meta) {
        switch (declaration.kind) {
            case "const":
                declaration.kind = Math.random() < 0.5 ? "let" : "var";
                break;
            case "let":
                declaration.kind = Math.random() < 0.5 ? "const" : "var";
                if (declaration.kind === "const" && !this._is_valid_const(declaration)) {
                    declaration.kind = "var";
                }
                break;
            case "var":
                declaration.kind = Math.random() < 0.5 ? "let" : "const";
                if (declaration.kind === "const" && !this._is_valid_const(declaration)) {
                    declaration.kind = "let";
                }
                break;
        }
        return gens_1.gencode(escodegen_1.default, declaration);
    }
}
exports.DeclarationTypeChangerOperator = DeclarationTypeChangerOperator;
class DeclarationDefaultsOperator extends DeclarationChangerOperator {
    _patch(declaration, declaration_meta) {
        for (let i = 0; i < declaration.declarations.length; ++i) {
            if (declaration.declarations[i].init == null) {
                const index = rand_1.Rand.range(DeclarationDefaultsOperator._defaults.length);
                const default_val = DeclarationDefaultsOperator._defaults[index];
                let initializer;
                if (default_val === "{}") {
                    const empty_obj = {
                        type: esprima_1.Syntax.ObjectExpression,
                        properties: []
                    };
                    initializer = empty_obj;
                }
                else {
                    let ast = esprima_1.parseScript(default_val);
                    initializer = ast.body[0].expression;
                }
                declaration.declarations[i].init = initializer;
            }
        }
        return gens_1.gencode(escodegen_1.default, declaration);
    }
}
exports.DeclarationDefaultsOperator = DeclarationDefaultsOperator;
DeclarationDefaultsOperator._defaults = [
    "{}", "String()",
    "Number()", "Array()",
    "Object()", "Boolean()",
    "true", "false",
    "null", "Symbol()",
];
