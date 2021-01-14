import { Syntax, parseScript } from "esprima";
import estree from "estree";
import escodegen from "escodegen";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { gencode } from "./gens";


abstract class DeclarationChangerOperator extends MutationOperator {
    private _declarations: Array<estree.VariableDeclaration> = [];
    private _declarations_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._declarations = [];
        this._declarations_meta = [];
        super._init();
    }

    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.VariableDeclaration) {
                this._declarations.push(node);
                this._declarations_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }

    protected abstract _patch(declaration: estree.VariableDeclaration, declaration_meta: any): string;

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let declarations: Array<estree.VariableDeclaration> = this._declarations.filter(value => { return super.node_id(value) === 0; });
        let declarations_meta: Array<any> = this._declarations_meta.filter(value => { return super.node_id(value) === 0; });

        if (declarations.length > 0) {
            const index = Rand.range(declarations.length);
            const node = declarations[index];
            const meta = declarations_meta[index];

            const patch = this._patch(node, meta);

            return this.cleaned_code.slice(0, meta.start.offset) +
                patch + this.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


export class DeclarationTypeChangerOperator extends DeclarationChangerOperator {
    private _is_valid_const(declaration: estree.VariableDeclaration): boolean {
        for (const declarator of declaration.declarations) {
            if (declarator.init == null)
                return false;
        }

        return true;
    }
    
    protected _patch(declaration: estree.VariableDeclaration, declaration_meta: any): string {
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

        return gencode(escodegen, declaration);
    }
}


export class DeclarationDefaultsOperator extends DeclarationChangerOperator {
    private static _defaults = [
        "{}", "String()",
        "Number()", "Array()",
        "Object()", "Boolean()",
        "true", "false",
        "null", "Symbol()", 
    ]
    
    protected _patch(declaration: estree.VariableDeclaration, declaration_meta: any): string {        
        for (let i = 0; i < declaration.declarations.length; ++i) {
            if (declaration.declarations[i].init == null) {
                const index = Rand.range(DeclarationDefaultsOperator._defaults.length)
                const default_val = DeclarationDefaultsOperator._defaults[index];
                let initializer: estree.Node;

                if (default_val === "{}") {
                    const empty_obj: estree.ObjectExpression = {
                        type: Syntax.ObjectExpression,
                        properties: []
                    }

                    initializer = empty_obj;
                }
                else {
                    let ast = parseScript(default_val);
                    initializer = (ast.body[0] as estree.ExpressionStatement).expression;
                }
                
                declaration.declarations[i].init = initializer as any;
            }
        }

        return gencode(escodegen, declaration);
    }
}
