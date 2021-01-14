"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Rand {
    static range(first, last, integer = true) {
        if (last === undefined) {
            last = first;
            return Math.floor(last * Math.random());
        }
        else {
            if (integer)
                return Math.floor((last - first) * Math.random()) + first;
            else
                return (last - first) * Math.random() + first;
        }
    }
    static generate(length, func = undefined, ...args) {
        if (length <= 0)
            return [];
        let rands = [];
        if (func === undefined) {
            for (let i = 0; i < length; ++i) {
                rands.push(Math.random());
            }
        }
        else {
            if (args === undefined) {
                for (let i = 0; i < length; ++i) {
                    rands.push(func());
                }
            }
            else {
                for (let i = 0; i < length; ++i) {
                    rands.push(func(...args));
                }
            }
        }
        return rands;
    }
}
exports.Rand = Rand;
