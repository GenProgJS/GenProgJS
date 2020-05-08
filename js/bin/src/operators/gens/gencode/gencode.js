"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function _gencode(generator, ast) {
    if (!generator)
        throw TypeError("Extractor type cannot be undefined, null or empty.");
    return generator.generate(ast);
}
exports.gencode = _gencode;
