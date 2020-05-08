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
}
exports.Rand = Rand;
