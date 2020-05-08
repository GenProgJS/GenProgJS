"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gencode_1 = require("./gencode/gencode");
exports.gencode = gencode_1.gencode;
var genode_1 = require("./genode/genode");
exports.Genode = genode_1._initGenode;
