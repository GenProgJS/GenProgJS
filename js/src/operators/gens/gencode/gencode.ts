export interface _Generator {
    generate: Function;
}

function _gencode(generator: _Generator, ast: any): string {
    if (!generator)
        throw TypeError("Extractor type cannot be undefined, null or empty.");

    return generator.generate(ast);
}

export { _gencode as gencode };
