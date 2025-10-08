"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var userDatabase_1 = require("./userDatabase");
var userSchema_1 = require("./userSchema");
var UserDataModel = userDatabase_1.default.model("UserData", userSchema_1.default);
exports.default = UserDataModel;
