"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gencode_1 = require("./gencode/gencode");
exports.gencode = gencode_1.gencode;
var genode_1 = require("./genode/genode");
exports.Genode = genode_1._initGenode;
var extractor_1 = require("./extractor/extractor");
exports.extract = extractor_1._extract;
exports.get_metadata = extractor_1._get_metadata;
