"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArgParser {
    static encode_src(code) {
        return code.split('\n').join('___EOL___');
    }
    static decode_src(code) {
        return code.split('___EOL___').join('\n');
    }
}
exports.ArgParser = ArgParser;
