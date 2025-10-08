"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var http = require("http");
var socket_io_1 = require("socket.io");
var userDataModel_1 = require("../src/database/userDataModel");
var cors = require("cors");
var app = express();
var server = http.createServer(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:6300", "http://192.168.88.30:6300", "https://connect4-vtzu.onrender.com"],
        methods: ["GET", "POST"],
        credentials: true
    },
});
app.use(cors({
    origin: ["http://localhost:6300", "http://192.168.88.30:6300", "https://connect4-vtzu.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
}));
var waiting_players = [];
var playAgainWaiting = new Map();
var time_up_check = new Map();
var game_time_up_check = new Map();
var active_players = new Map();
var rooms = new Map();
app.get("/playerAllInfo/:playerName", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var playerName, playerData, updatedFriends, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                playerName = req.params.playerName;
                return [4 /*yield*/, userDataModel_1.default.findOne({ username: playerName }).select({ password: 0 })];
            case 1:
                playerData = _a.sent();
                if (!playerData) {
                    res.status(404).json({ error: "Player not found" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, Promise.all(playerData === null || playerData === void 0 ? void 0 : playerData.friends.map(function (friend) { return __awaiter(void 0, void 0, void 0, function () {
                        var friendData;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!friend.friendName)
                                        return [2 /*return*/, friend];
                                    return [4 /*yield*/, userDataModel_1.default.findOne({ username: friend.friendName }).select({ active: 1, winNumber: 1, lossNumber: 1 })];
                                case 1:
                                    friendData = _a.sent();
                                    return [2 /*return*/, __assign(__assign({}, friend.toObject()), { friendWinNumber: friendData ? friendData.winNumber : 0, friendLossNumber: friendData ? friendData.lossNumber : 0, active: friendData ? friendData.active : false })];
                            }
                        });
                    }); }))];
            case 2:
                updatedFriends = _a.sent();
                if (playerData) {
                    playerData.set('friends', updatedFriends, { strict: false });
                }
                else {
                    res.status(404).json({ error: "Player not found" });
                    return [2 /*return*/];
                }
                res.json(playerData);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("Error fetching player info:", error_1);
                res.status(500).json({ error: "Internal server error" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
io.on("connection", function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("A user connected:", socket.id);
        socket.on("signup", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var username, password, is_exists, newUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("New signup:", data);
                        username = data.username;
                        password = data.password;
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: username })];
                    case 1:
                        is_exists = _a.sent();
                        console.log("Checking if user exists:", is_exists);
                        if (is_exists) {
                            socket.emit("signup_response", { success: false, message: "Username already exists" });
                            return [2 /*return*/];
                        }
                        newUser = new userDataModel_1.default({ username: username, password: password });
                        newUser.save()
                            .then(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                socket.emit("signup_response", { success: true, message: "Signup successful", username: username });
                                return [2 /*return*/];
                            });
                        }); })
                            .catch(function (error) {
                            console.error("Error saving user:", error);
                            socket.emit("signup_response", { success: false, message: "Signup failed" });
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on('login', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var username, password, user, isPasswordValid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = data.username;
                        password = data.password;
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: username })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            socket.emit("login_response", { success: false, message: "User not found, Sign Up first" });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: username, password: password })];
                    case 2:
                        user = _a.sent();
                        isPasswordValid = (user === null || user === void 0 ? void 0 : user.password) === password;
                        if (isPasswordValid) {
                            socket.emit("login_response", { success: true, message: "Login successful", username: username });
                        }
                        else {
                            socket.emit("login_response", { success: false, message: "Wrong password" });
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("active_me", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var user, friends, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        socket.join(data.playerName);
                        active_players.set(socket.id, data.playerName);
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: data.playerName })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: data.playerName }, { active: true })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: data.playerName }).select({ friends: 1, _id: 0 })];
                    case 3:
                        friends = _a.sent();
                        for (i = 0; i < friends.friends.length; i++) {
                            socket.to(friends === null || friends === void 0 ? void 0 : friends.friends[i].friendName).emit("active", data.playerName);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("check_myRoom", function (data) {
            var _a, _b, _c, _d, _e, _f;
            var myRoomID = data.myRoomID, myName = data.myName;
            if (rooms.has(myRoomID)) {
                var the_room = rooms.get(myRoomID);
                var the_board = the_room === null || the_room === void 0 ? void 0 : the_room.board;
                var start_time = the_room === null || the_room === void 0 ? void 0 : the_room.start_time;
                var duration = the_room === null || the_room === void 0 ? void 0 : the_room.duration;
                var total_time = 0;
                if (start_time instanceof Date) {
                    total_time = Math.floor((new Date().getTime() - start_time.getTime()) / 1000);
                }
                var time1;
                var time2;
                if ((the_room === null || the_room === void 0 ? void 0 : the_room.player1_name) === myName) {
                    the_room.player1_socketID = socket.id;
                    (_a = io.sockets.sockets.get(socket.id)) === null || _a === void 0 ? void 0 : _a.join(myRoomID);
                    (_c = io.sockets.sockets.get((_b = rooms.get(myRoomID)) === null || _b === void 0 ? void 0 : _b.player2_socketID)) === null || _c === void 0 ? void 0 : _c.join(myRoomID);
                    if (the_room === null || the_room === void 0 ? void 0 : the_room.player1_turn) {
                        time1 = (the_room === null || the_room === void 0 ? void 0 : the_room.player1_time) - (total_time + (the_room === null || the_room === void 0 ? void 0 : the_room.player1_time) + (the_room === null || the_room === void 0 ? void 0 : the_room.player2_time) - 120 * duration);
                        time2 = the_room === null || the_room === void 0 ? void 0 : the_room.player2_time;
                    }
                    else {
                        time1 = the_room === null || the_room === void 0 ? void 0 : the_room.player1_time;
                        time2 = (the_room === null || the_room === void 0 ? void 0 : the_room.player2_time) - (total_time + (the_room === null || the_room === void 0 ? void 0 : the_room.player1_time) + (the_room === null || the_room === void 0 ? void 0 : the_room.player2_time) - 120 * duration);
                    }
                    console.log(time1, time2);
                    socket.emit("check_myRoom_response", { the_board: the_board, myTurn: the_room === null || the_room === void 0 ? void 0 : the_room.player1_turn, myScore: the_room === null || the_room === void 0 ? void 0 : the_room.player1_score,
                        opScore: the_room === null || the_room === void 0 ? void 0 : the_room.player2_score, opName: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name, matchStatus: the_room === null || the_room === void 0 ? void 0 : the_room.active_status, first_player: true,
                        time_1: time1, time_2: time2 });
                }
                else {
                    the_room.player2_socketID = socket.id;
                    (_d = io.sockets.sockets.get(socket.id)) === null || _d === void 0 ? void 0 : _d.join(myRoomID);
                    (_f = io.sockets.sockets.get((_e = rooms.get(myRoomID)) === null || _e === void 0 ? void 0 : _e.player1_socketID)) === null || _f === void 0 ? void 0 : _f.join(myRoomID);
                    if (the_room === null || the_room === void 0 ? void 0 : the_room.player2_turn) {
                        time1 = (the_room === null || the_room === void 0 ? void 0 : the_room.player2_time) - (total_time + (the_room === null || the_room === void 0 ? void 0 : the_room.player1_time) + (the_room === null || the_room === void 0 ? void 0 : the_room.player2_time) - 120 * duration);
                        time2 = the_room === null || the_room === void 0 ? void 0 : the_room.player1_time;
                    }
                    else {
                        time1 = the_room === null || the_room === void 0 ? void 0 : the_room.player2_time;
                        time2 = (the_room === null || the_room === void 0 ? void 0 : the_room.player1_time) - (total_time + (the_room === null || the_room === void 0 ? void 0 : the_room.player1_time) + (the_room === null || the_room === void 0 ? void 0 : the_room.player2_time) - 120 * duration);
                    }
                    console.log(time1, time2);
                    socket.emit("check_myRoom_response", { the_board: the_board, myTurn: the_room === null || the_room === void 0 ? void 0 : the_room.player2_turn, myScore: the_room === null || the_room === void 0 ? void 0 : the_room.player2_score,
                        opScore: the_room === null || the_room === void 0 ? void 0 : the_room.player1_score, opName: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name, matchStatus: the_room === null || the_room === void 0 ? void 0 : the_room.active_status, first_player: false,
                        time_1: time1, time_2: time2 });
                }
                socket.emit("game_restored_response", duration);
                // socket.to(myRoomID).emit("check_myRoom_response",rooms.get(myRoomID)?.board)
            }
        });
        socket.on("join_game", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var username, playerData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = data.username;
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: username })];
                    case 1:
                        playerData = _a.sent();
                        if (playerData) {
                            setTimeout(function () {
                                socket.emit("join_game_response", { success: true, message: "Joined game successfully", winNumber: playerData.winNumber, lossNumber: playerData.lossNumber });
                            }, 200);
                        }
                        else {
                            socket.emit("join_game_response", { success: false, message: "User not found" });
                            console.log("User not found: ".concat(username));
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("new_game", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var username, playerLevel, selectedDuration, found_match, i, level_diff, opponent, opponent_name, opponent_socketId, i, curr_diff, i;
            return __generator(this, function (_a) {
                username = data.username, playerLevel = data.playerLevel, selectedDuration = data.selectedDuration;
                console.log("New game requested by:", username, selectedDuration);
                if (waiting_players.length === 0) {
                    waiting_players.push({
                        username: username,
                        socketId: socket.id,
                        level: playerLevel,
                        duration: selectedDuration
                    });
                    socket.emit("new_game_waiting_response");
                    return [2 /*return*/];
                }
                found_match = false;
                for (i = 0; i < waiting_players.length; i++) {
                    if (waiting_players[i].duration === selectedDuration) {
                        found_match = true;
                        break;
                    }
                }
                if (!found_match) {
                    socket.emit("new_game_waiting_response");
                    return [2 /*return*/];
                }
                waiting_players.push({
                    username: username,
                    socketId: socket.id,
                    level: playerLevel,
                    duration: selectedDuration
                });
                level_diff = 100000;
                for (i = 0; i < waiting_players.length; i++) {
                    if (waiting_players[i].username !== username) {
                        curr_diff = Math.abs(waiting_players[i].level - playerLevel);
                        if (curr_diff < level_diff) {
                            level_diff = curr_diff;
                            opponent = waiting_players[i];
                            opponent_name = waiting_players[i].username;
                            opponent_socketId = waiting_players[i].socketId;
                        }
                    }
                }
                console.log("opponent: ", opponent);
                if (opponent) {
                    startNewGame(socket, username, opponent_name, opponent_socketId, selectedDuration);
                    for (i = 0; i < waiting_players.length; i++) {
                        if (waiting_players[i].username === username || waiting_players[i].username === opponent_name) {
                            waiting_players.splice(i, 1);
                            i--;
                        }
                    }
                }
                return [2 /*return*/];
            });
        }); });
        socket.on("deleteFromWaiting", function () {
            for (var i = 0; i < waiting_players.length; i++) {
                if (waiting_players[i].socketId === socket.id) {
                    waiting_players.splice(i, 1);
                    i--;
                }
            }
        });
        socket.on("playAgain", function (data) {
            if (playAgainWaiting.has(data.roomID)) {
                var the_room = rooms.get(data.roomID);
                the_room.active_status = true;
                the_room.player1_time = data.duration * 60;
                the_room.player2_time = data.duration * 60;
                the_room.start_time = new Date();
                the_room.current_turn_start_time = new Date();
                the_room.duration = data.duration;
                socket.to(data.roomID).emit("playAgain_response", true);
                socket.emit("playAgain_response", true);
                playAgainWaiting.delete(data.roomID);
            }
            else {
                playAgainWaiting.set(data.roomID, data.username);
            }
        });
        socket.on("time_up", function (data) {
            if (time_up_check.has(data.roomID)) {
                time_up_check.delete(data.roomID);
                return;
            }
            time_up_check.set(data.roomID, data.username);
            if (!playAgainWaiting.has(data.roomID)) {
                socket.to(data.roomID).emit("opponent_left", { message: "Both left the game." });
                socket.emit("opponent_left", { message: "Both left the game." });
            }
            else {
                if (playAgainWaiting.get(data.roomID) === data.username) {
                    socket.to(data.roomID).emit("opponent_left", { message: "Time up for the game." });
                    socket.emit("opponent_left", { message: "Your opponent has left the game." });
                }
                else {
                    socket.emit("opponent_left", { message: "Time up for the game." });
                    socket.to(data.roomID).emit("opponent_left", { message: "Your opponent has left the game." });
                }
            }
            updateDatabase(rooms.get(data.roomID), data.username);
            playAgainWaiting.delete(data.roomID);
            rooms.delete(data.roomID);
            socket.leave(data.roomID);
        });
        socket.on("leave_game", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var username, roomID, matchActive, duration, leaveAndPlay, the_room, user1, opponent, user2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = data.username, roomID = data.roomID, matchActive = data.matchActive, duration = data.duration, leaveAndPlay = data.leaveAndPlay;
                        the_room = rooms.get(roomID);
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: username })];
                    case 1:
                        user1 = _a.sent();
                        opponent = (the_room === null || the_room === void 0 ? void 0 : the_room.player1_name) === username ? the_room === null || the_room === void 0 ? void 0 : the_room.player2_name : the_room === null || the_room === void 0 ? void 0 : the_room.player1_name;
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: opponent })];
                    case 2:
                        user2 = _a.sent();
                        if (!user1 || !user2)
                            return [2 /*return*/];
                        if (!matchActive) return [3 /*break*/, 5];
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: username }, { $set: { lossNumber: (user1.lossNumber || 0) + 1 } })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: opponent }, { $set: { winNumber: (user2.winNumber || 0) + 1 } })];
                    case 4:
                        _a.sent();
                        if (username === (the_room === null || the_room === void 0 ? void 0 : the_room.player1_name)) {
                            the_room.player2_score += 1;
                        }
                        else {
                            the_room.player1_score += 1;
                        }
                        _a.label = 5;
                    case 5:
                        updateDatabase(the_room, username);
                        socket.leave(roomID);
                        if (playAgainWaiting.has(roomID)) {
                            playAgainWaiting.delete(roomID);
                        }
                        console.log(username, "left the game in room:", roomID);
                        socket.to(roomID).emit("opponent_left", { message: "Your opponent has left the game.", matchActive: matchActive });
                        socket.emit("me_left", { message: "You have left the game.", matchActive: matchActive, leaveAndPlay: leaveAndPlay });
                        if (rooms.has(roomID)) {
                            rooms.delete(roomID);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("clicked_colIndex", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var the_room, the_board, time_diff, value, i, return_value, the_result, j, user1, user2, user1, user2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        socket.broadcast.to(data.roomID).emit("click_colIndex_responce", { colIndex: data.colIndex, color: data.color });
                        the_room = rooms.get(data.roomID);
                        the_board = the_room === null || the_room === void 0 ? void 0 : the_room.board;
                        time_diff = Math.floor((new Date().getTime() - (the_room === null || the_room === void 0 ? void 0 : the_room.current_turn_start_time).getTime()) / 1000);
                        the_room.current_turn_start_time = new Date();
                        value = (data.color === "green") ? 0 : 1;
                        if (value) {
                            the_room.player2_time -= time_diff;
                            socket.emit("stopTimer1", the_room.player2_time);
                        }
                        else {
                            the_room.player1_time -= time_diff;
                            socket.emit("stopTimer1", the_room.player1_time);
                        }
                        the_result = [];
                        for (i = 1; i < 7; i++) {
                            if (i === 6 || the_board[i][data.colIndex] !== -1) {
                                the_board[i - 1][data.colIndex] = value;
                                _a = check_result(i - 1, data.colIndex, value, the_board), the_result = _a[0], return_value = _a[1];
                                break;
                            }
                        }
                        if (the_room === null || the_room === void 0 ? void 0 : the_room.player1_turn) {
                            the_room.player1_turn = false;
                            the_room.player2_turn = true;
                        }
                        else {
                            the_room.player2_turn = false;
                            the_room.player1_turn = true;
                        }
                        if (return_value === -1) {
                            j = void 0;
                            for (j = 0; j < 7; j++) {
                                if (the_board[0][j] === -1)
                                    break;
                            }
                            if (j === 7) {
                                the_room.drawNumber += 1;
                                socket.to(data.roomID).emit("draw");
                                socket.to(data.roomID).emit("makeTurnTrue_response", { time_1: 0, time_2: 0 });
                                socket.emit("draw");
                                return [2 /*return*/];
                            }
                        }
                        if (!(return_value !== -1)) return [3 /*break*/, 11];
                        if (!(value === 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name })];
                    case 1:
                        user1 = _b.sent();
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name })];
                    case 2:
                        user2 = _b.sent();
                        if (!user1 || !user2)
                            return [2 /*return*/];
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name }, { $set: { winNumber: (user1.winNumber || 0) + 1 } })];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name }, { $set: { lossNumber: (user2.lossNumber || 0) + 1 } })];
                    case 4:
                        _b.sent();
                        the_room.player1_score += 1;
                        return [3 /*break*/, 10];
                    case 5:
                        if (!(value === 1)) return [3 /*break*/, 10];
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name })];
                    case 6:
                        user1 = _b.sent();
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name })];
                    case 7:
                        user2 = _b.sent();
                        if (!user1 || !user2)
                            return [2 /*return*/];
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name }, { $set: { lossNumber: (user1.lossNumber || 0) + 1 } })];
                    case 8:
                        _b.sent();
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name }, { $set: { winNumber: (user2.winNumber || 0) + 1 } })];
                    case 9:
                        _b.sent();
                        the_room.player2_score += 1;
                        _b.label = 10;
                    case 10:
                        clearBoard(the_board);
                        the_room.active_status = false;
                        the_room.player1_time = data.duration * 60;
                        the_room.player2_time = data.duration * 60;
                        setTimeout(function () {
                            console.log(the_result, return_value);
                            socket.to(data.roomID).emit("showResult_response", { the_result: the_result, return_value: return_value });
                            socket.emit("showResult_response", { the_result: the_result, return_value: return_value });
                        }, (i + 1) * 150);
                        _b.label = 11;
                    case 11:
                        if (return_value === -1) {
                            setTimeout(function () {
                                socket.broadcast.to(data.roomID).emit("makeTurnTrue_response", { time_1: the_room === null || the_room === void 0 ? void 0 : the_room.player1_time, time_2: the_room === null || the_room === void 0 ? void 0 : the_room.player2_time });
                                if (value) {
                                    socket.emit("startTimer2", the_room === null || the_room === void 0 ? void 0 : the_room.player1_time);
                                }
                                else {
                                    socket.emit("startTimer2", the_room === null || the_room === void 0 ? void 0 : the_room.player2_time);
                                }
                            }, (i + 1) * 150);
                        }
                        else {
                            setTimeout(function () {
                                socket.broadcast.to(data.roomID).emit("makeTurnTrue_response", { time_1: the_room === null || the_room === void 0 ? void 0 : the_room.player1_time, time_2: the_room === null || the_room === void 0 ? void 0 : the_room.player2_time });
                            }, (i + 5) * 150);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("game_time_up", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var the_room, player, opponent, user1, user2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (game_time_up_check.has(data.roomID)) {
                            game_time_up_check.delete(data.roomID);
                            return [2 /*return*/];
                        }
                        game_time_up_check.set(data.roomID, data.value);
                        the_room = rooms.get(data.roomID);
                        if (!(the_room === null || the_room === void 0 ? void 0 : the_room.active_status))
                            return [2 /*return*/];
                        if (!data.firstPlayer) return [3 /*break*/, 3];
                        player = the_room === null || the_room === void 0 ? void 0 : the_room.player1_name;
                        opponent = the_room === null || the_room === void 0 ? void 0 : the_room.player2_name;
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: player })];
                    case 1:
                        user1 = _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: opponent })];
                    case 2:
                        user2 = _a.sent();
                        if (data.value === 1) {
                            the_room.player2_score += 1;
                            socket.to(data.roomID).emit("showResult_response", { the_result: null, return_value: 1 });
                            socket.emit("showResult_response", { the_result: null, return_value: 1 });
                        }
                        else {
                            the_room.player1_score += 1;
                            socket.to(data.roomID).emit("showResult_response", { the_result: null, return_value: 0 });
                            socket.emit("showResult_response", { the_result: null, return_value: 0 });
                        }
                        return [3 /*break*/, 6];
                    case 3:
                        player = the_room === null || the_room === void 0 ? void 0 : the_room.player2_name;
                        opponent = the_room === null || the_room === void 0 ? void 0 : the_room.player1_name;
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: player })];
                    case 4:
                        user1 = _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: opponent })];
                    case 5:
                        user2 = _a.sent();
                        if (data.value === 1) {
                            the_room.player1_score += 1;
                            socket.to(data.roomID).emit("showResult_response", { the_result: null, return_value: 0 });
                            socket.emit("showResult_response", { the_result: null, return_value: 0 });
                        }
                        else {
                            the_room.player2_score += 1;
                            socket.to(data.roomID).emit("showResult_response", { the_result: null, return_value: 1 });
                            socket.emit("showResult_response", { the_result: null, return_value: 1 });
                        }
                        _a.label = 6;
                    case 6:
                        if (!(user1 && user2)) return [3 /*break*/, 9];
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: opponent }, { $set: { winNumber: (user2.winNumber || 0) + 1 } })];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: player }, { $set: { lossNumber: (user1.lossNumber || 0) + 1 } })];
                    case 8:
                        _a.sent();
                        the_room.active_status = false;
                        the_room.player1_time = 60;
                        the_room.player2_time = 60;
                        clearBoard(the_room.board);
                        _a.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        }); });
        socket.on("requestFriend", function (data) {
            console.log(data);
            socket.to(data.roomID).emit("requestFriend_response", { playerName: data.playerName });
            socket.emit("requestFriend_response_me");
        });
        socket.on("acceptFriendRequest", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var user1, user2, friend1, friend2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, userDataModel_1.default.findOne({ username: data.playerName })];
                    case 1:
                        user1 = _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: data.opponent })];
                    case 2:
                        user2 = _a.sent();
                        friend1 = {
                            friendName: user2 === null || user2 === void 0 ? void 0 : user2.username,
                        };
                        friend2 = {
                            friendName: user1 === null || user1 === void 0 ? void 0 : user1.username,
                        };
                        user1 === null || user1 === void 0 ? void 0 : user1.friends.push(friend1);
                        user1 === null || user1 === void 0 ? void 0 : user1.save();
                        user2 === null || user2 === void 0 ? void 0 : user2.friends.push(friend2);
                        user2 === null || user2 === void 0 ? void 0 : user2.save();
                        socket.to(data.roomID).emit("acceptFriendRequest_response", { playerName: data.playerName });
                        socket.emit("acceptFriendRequest_response_me");
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("denyFriendRequest", function (data) {
            socket.to(data.roomID).emit("denyFriendRequest_response", { playerName: data.playerName });
            socket.emit("denyFriendRequest_response_me");
        });
        socket.on("requestFriendToPlay", function (data) {
            socket.to(data.friendName).emit("requestFriendToPlay_response", { friendName: data.playerName, friendSocketID: socket.id, duration: data.duration });
        });
        socket.on("playWithFriend", function (data) {
            var playerName = data.playerName, friendSocketID = data.friendSocketID, friend = data.friend, duration = data.duration;
            startNewGame(socket, playerName, friend, friendSocketID, duration);
        });
        socket.on("unfriend", function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var playerName, friendName, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        playerName = data.playerName, friendName = data.friendName, index = data.index;
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: playerName }, {
                                $pull: {
                                    friends: {
                                        friendName: friendName
                                    }
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: friendName }, {
                                $pull: {
                                    friends: {
                                        friendName: playerName
                                    }
                                }
                            })];
                    case 2:
                        _a.sent();
                        socket.to(friendName).emit("upfriend_response", playerName);
                        socket.emit("upfriend_response_me", { index: index, friendName: friendName });
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("playLater", function (data) {
            socket.to(data.friendName).emit("playLater_response", { friendName: data.playerName });
        });
        socket.on("disconnecting", function () { return __awaiter(void 0, void 0, void 0, function () {
            var roomID, who_leave, index, friends, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rooms.forEach(function (room) {
                            if (room.player1_socketID === socket.id) {
                                roomID = room.roomID;
                                room.player1_socketID = null;
                                who_leave = room.player1_name;
                            }
                            else if (room.player2_socketID === socket.id) {
                                roomID = room.roomID;
                                room.player2_socketID = null;
                                who_leave = room.player2_name;
                            }
                        });
                        index = waiting_players.findIndex(function (p) { return p.socketId === socket.id; });
                        if (index !== -1) {
                            waiting_players.splice(index, 1);
                        }
                        return [4 /*yield*/, userDataModel_1.default.updateOne({ username: active_players.get(socket.id) }, { active: false })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, userDataModel_1.default.findOne({ username: active_players.get(socket.id) }).select({ friends: 1 })];
                    case 2:
                        friends = _a.sent();
                        if ((friends === null || friends === void 0 ? void 0 : friends.friends) && friends.friends.length > 0) {
                            for (i = 0; i < friends.friends.length; i++) {
                                socket.to(friends.friends[i].friendName).emit("inActive", active_players.get(socket.id));
                            }
                        }
                        setTimeout(function () {
                            var the_room = rooms.get(roomID);
                            if (the_room && (the_room.player1_socketID === null || the_room.player2_socketID === null)) {
                                socket.to(roomID).emit("opponent_left", { message: "Your opponent has disconnected.", matchActive: the_room.active_status });
                                if (the_room.active_status) {
                                    Promise.all([
                                        userDataModel_1.default.findOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name }),
                                        userDataModel_1.default.findOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name })
                                    ]).then(function (_a) {
                                        var user1 = _a[0], user2 = _a[1];
                                        if (!user1 || !user2)
                                            return;
                                        if (who_leave === the_room.player1_name) {
                                            userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name }, { $set: { lossNumber: (user1.lossNumber || 0) + 1 } }).then(function () {
                                            });
                                            userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name }, { $set: { winNumber: (user2.winNumber || 0) + 1 } }).then(function () {
                                                the_room.player2_score += 1;
                                            });
                                        }
                                        else {
                                            userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player1_name }, { $set: { winNumber: (user1.winNumber || 0) + 1 } }).then(function () {
                                                the_room.player1_score += 1;
                                            });
                                            userDataModel_1.default.updateOne({ username: the_room === null || the_room === void 0 ? void 0 : the_room.player2_name }, { $set: { lossNumber: (user2.lossNumber || 0) + 1 } }).then(function () {
                                            });
                                        }
                                        clearBoard(the_room.board);
                                        the_room.active_status = false;
                                        the_room.player1_time = 0;
                                        the_room.player2_time = 0;
                                    });
                                }
                                updateDatabase(the_room, who_leave);
                                if (rooms.has(roomID)) {
                                    rooms.delete(roomID);
                                }
                                if (playAgainWaiting.has(roomID)) {
                                    playAgainWaiting.delete(roomID);
                                }
                                socket.leave(roomID);
                            }
                        }, 20000);
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on("disconnect", function () {
            console.log("User disconnected:", socket.id);
        });
        return [2 /*return*/];
    });
}); });
server.listen(6400, function () {
    console.log("✅ Server running on http://192.168.88.30:6400");
});
var check_result = function (row, col, value, board) {
    var resultCells = [];
    var count = 0;
    var j = 0;
    resultCells.push([row, col]);
    for (var i = col - 1; i >= 0 && j < 3; i--, j++) {
        if (board[row][i] === value) {
            count++;
            resultCells.push([row, i]);
        }
        else {
            break;
        }
    }
    j = 0;
    for (var i = col + 1; i < 7 && j < 3; i++, j++) {
        if (board[row][i] === value) {
            resultCells.push([row, i]);
            count++;
        }
        else {
            break;
        }
    }
    if (count >= 3) {
        return [resultCells, value];
    }
    //up-down
    resultCells = [];
    resultCells.push([row, col]);
    count = 0;
    j = 0;
    for (var i = row + 1; i < 6 && j < 3; i++, j++) {
        if (board[i][col] === value) {
            resultCells.push([i, col]);
            count++;
        }
        else {
            break;
        }
    }
    if (count >= 3) {
        return [resultCells, value];
    }
    // 1st corner
    resultCells = [];
    resultCells.push([row, col]);
    count = 0;
    var k = 0;
    for (var i = row - 1, j_1 = col - 1; i >= 0 && j_1 >= 0 && k < 3; i--, j_1--, k++) {
        if (board[i][j_1] === value) {
            count++;
            resultCells.push([i, j_1]);
        }
        else {
            break;
        }
    }
    k = 0;
    for (var i = row + 1, j_2 = col + 1; i < 6 && j_2 < 7 && k < 3; i++, j_2++, k++) {
        if (board[i][j_2] === value) {
            count++;
            resultCells.push([i, j_2]);
        }
        else {
            break;
        }
    }
    if (count >= 3) {
        return [resultCells, value];
    }
    //2nd corner
    resultCells = [];
    resultCells.push([row, col]);
    count = 0;
    k = 0;
    for (var i = row - 1, j_3 = col + 1; i >= 0 && j_3 < 7 && k < 3; i--, j_3++, k++) {
        if (board[i][j_3] === value) {
            count++;
            resultCells.push([i, j_3]);
        }
        else {
            break;
        }
    }
    k = 0;
    for (var i = row + 1, j_4 = col - 1; i < 6 && j_4 >= 0 && k < 3; i++, j_4--, k++) {
        if (board[i][j_4] === value) {
            count++;
            resultCells.push([i, j_4]);
        }
        else {
            break;
        }
    }
    if (count >= 3) {
        return [resultCells, value];
    }
    return [resultCells, -1];
};
var clearBoard = function (board) {
    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 7; j++) {
            board[i][j] = -1;
        }
    }
};
var updateDatabase = function (the_room, who_leave) { return __awaiter(void 0, void 0, void 0, function () {
    var user1, opponent, user2, myScore, opponentScore, now, myHistory, oppHistory;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, userDataModel_1.default.findOne({ username: who_leave })];
            case 1:
                user1 = _a.sent();
                opponent = (the_room === null || the_room === void 0 ? void 0 : the_room.player1_name) === who_leave ? the_room === null || the_room === void 0 ? void 0 : the_room.player2_name : the_room === null || the_room === void 0 ? void 0 : the_room.player1_name;
                return [4 /*yield*/, userDataModel_1.default.findOne({ username: opponent })];
            case 2:
                user2 = _a.sent();
                myScore = who_leave === (the_room === null || the_room === void 0 ? void 0 : the_room.player1_name) ? the_room.player1_score : the_room === null || the_room === void 0 ? void 0 : the_room.player2_score;
                opponentScore = who_leave === (the_room === null || the_room === void 0 ? void 0 : the_room.player1_name) ? the_room.player2_score : the_room === null || the_room === void 0 ? void 0 : the_room.player1_score;
                now = new Date();
                myHistory = {
                    opponent: opponent,
                    myScore: myScore,
                    opponentScore: opponentScore,
                    totalMatch: (the_room === null || the_room === void 0 ? void 0 : the_room.player1_score) + (the_room === null || the_room === void 0 ? void 0 : the_room.player2_score) + (the_room === null || the_room === void 0 ? void 0 : the_room.drawNumber),
                    matchDuration: the_room === null || the_room === void 0 ? void 0 : the_room.duration,
                    playedTime: now
                };
                oppHistory = {
                    opponent: who_leave,
                    myScore: opponentScore,
                    opponentScore: myScore,
                    totalMatch: (the_room === null || the_room === void 0 ? void 0 : the_room.player1_score) + (the_room === null || the_room === void 0 ? void 0 : the_room.player2_score) + (the_room === null || the_room === void 0 ? void 0 : the_room.drawNumber),
                    matchDuration: the_room === null || the_room === void 0 ? void 0 : the_room.duration,
                    playedTime: now
                };
                user1 === null || user1 === void 0 ? void 0 : user1.histories.push(myHistory);
                return [4 /*yield*/, (user1 === null || user1 === void 0 ? void 0 : user1.save())];
            case 3:
                _a.sent();
                user2 === null || user2 === void 0 ? void 0 : user2.histories.push(oppHistory);
                return [4 /*yield*/, (user2 === null || user2 === void 0 ? void 0 : user2.save())];
            case 4:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var startNewGame = function (socket, username, opponent_name, opponent_socketId, selectedDuration) { return __awaiter(void 0, void 0, void 0, function () {
    var roomID, user, friendList, friendFound, i, i, newRoom;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                roomID = username + "#" + opponent_name + "#" + Date.now();
                (_a = io.sockets.sockets.get(opponent_socketId)) === null || _a === void 0 ? void 0 : _a.join(roomID);
                (_b = io.sockets.sockets.get(socket.id)) === null || _b === void 0 ? void 0 : _b.join(roomID);
                io.to(opponent_socketId).emit("found_match", { opponent: username, roomID: roomID, duration: selectedDuration });
                io.to(socket.id).emit("found_match", { opponent: opponent_name, roomID: roomID, duration: selectedDuration });
                return [4 /*yield*/, userDataModel_1.default.findOne({ username: username })];
            case 1:
                user = _c.sent();
                friendList = user === null || user === void 0 ? void 0 : user.friends;
                friendFound = false;
                for (i = 0; i < (friendList === null || friendList === void 0 ? void 0 : friendList.length); i++) {
                    if (friendList[i].friendName === opponent_name) {
                        friendFound = true;
                        break;
                    }
                }
                setTimeout(function () {
                    io.to(socket.id).emit("game_start", { roomID: roomID, players: [username, opponent_name], turn: false, duration: selectedDuration, friendFound: friendFound });
                    io.to(opponent_socketId).emit("game_start", { roomID: roomID, players: [opponent_name, username], turn: true, duration: selectedDuration, friendFound: friendFound });
                    console.log(socket.id, opponent_socketId, socket.rooms);
                }, 1000);
                for (i = 0; i < waiting_players.length; i++) {
                    if (waiting_players[i].username === username || waiting_players[i].username === opponent_name) {
                        waiting_players.splice(i, 1);
                        i--;
                    }
                }
                newRoom = {
                    roomID: roomID,
                    player1_socketID: opponent_socketId,
                    player2_socketID: socket.id,
                    player1_name: opponent_name,
                    player2_name: username,
                    player1_score: 0,
                    player2_score: 0,
                    board: Array(6).fill(null).map(function () { return Array(7).fill(-1); }),
                    active_status: true,
                    player1_turn: true,
                    player2_turn: false,
                    player1_time: selectedDuration * 60,
                    player2_time: selectedDuration * 60,
                    start_time: new Date(),
                    current_turn_start_time: new Date(),
                    duration: selectedDuration,
                    drawNumber: 0
                };
                if (!rooms.has(roomID)) {
                    rooms.set(roomID, newRoom);
                }
                return [2 /*return*/];
        }
    });
}); };
