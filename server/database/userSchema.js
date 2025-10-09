"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var userDatabase_1 = require("./userDatabase");
var userDataSchema = new userDatabase_1.default.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: false,
    },
    winNumber: {
        type: Number,
        default: 0
    },
    lossNumber: {
        type: Number,
        default: 0
    },
    histories: [
        {
            opponent: {
                type: String,
            },
            myScore: {
                type: Number,
            },
            opponentScore: {
                type: Number,
            },
            totalMatch: {
                type: Number,
            },
            matchDuration: {
                type: Number,
            },
            playedTime: {
                type: Date,
                default: Date.now()
            }
        }
    ],
    friends: [
        {
            friendName: {
                type: String,
            },
            friendWinNumber: {
                type: Number,
            },
            friendLossNumber: {
                type: Number,
            },
            active: {
                type: Boolean,
                default: false,
            },
        }
    ]
});
exports.default = userDataSchema;
