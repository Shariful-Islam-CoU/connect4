import * as express from "express";
import * as http from "http";
import { Server } from "socket.io";
import UserDataModel from "./database/userDataModel";
import { Socket } from "socket.io-client";
import userDataSchema from "./database/userSchema";
import Room from "./room";
import * as cors from "cors";
import * as path from 'path';

const app = (express as any)();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:6300", "http://192.168.88.30:6300", "https://connect4-1-dfxu.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000
});
 


app.use((cors as any)({
  origin: ["http://localhost:6300", "http://192.168.88.30:6300", "https://connect4-1-dfxu.onrender.com"],
  methods: ["GET", "POST"],
  credentials: true
}));

// Serve built client (Vite output) when present
const staticPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(staticPath));
// SPA fallback — serve index.html for non-api/socket routes
// Use middleware instead of a route with '*' to avoid path-to-regexp issues on some platforms
app.use((req: any, res: any, next: any) => {
  // Allow socket.io engine and API requests to pass through to their handlers
  if (req.path && (req.path.startsWith('/socket.io') || req.path.startsWith('/api') || req.path.startsWith('/playerAllInfo'))) {
    return next();
  }
  // Serve index.html for other GET requests (SPA fallback)
  if (req.method === 'GET') {
    return res.sendFile(path.join(staticPath, 'index.html'));
  }
  next();
});






const waiting_players: {
  username: string;
  socketId: string;
  level: number;
  duration: number;
}[] = [];


const playAgainWaiting=new Map<string,string>();
const time_up_check=new Map<string,string>();
const game_time_up_check=new Map<string,string>();
const active_players=new Map<string,string>();

const rooms= new Map<string,Room>();


app.get("/playerAllInfo/:playerName", async (req, res) => {
  try {
    const playerName = req.params.playerName;
    const playerData = await UserDataModel.findOne({ username: playerName }).select({password:0});
    if(!playerData){
      res.status(404).json({ error: "Player not found" });
      return;
    }
    const updatedFriends=await Promise.all(playerData?.friends.map(async(friend)=>{
      if (!friend.friendName) return friend;
        const friendData = await UserDataModel.findOne({ username: friend.friendName }).select({ active:1, winNumber: 1, lossNumber: 1 });
        return {
          ...friend.toObject(),
          friendWinNumber: friendData ? friendData.winNumber : 0,
          friendLossNumber: friendData ? friendData.lossNumber : 0,
          active: friendData ? friendData.active : false
        };
      }));


    if (playerData) {
      playerData.set('friends', updatedFriends, { strict: false });
    } else {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    

    res.json(playerData)
  } catch (error) {
    console.error("Error fetching player info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});











io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);


  socket.on("signup", async (data) => {
    console.log("New signup:", data);

    const username=data.username;
    const password=data.password;



    const is_exists= await UserDataModel.findOne({ username:username });
    console.log("Checking if user exists:", is_exists);

    if (is_exists) {
      socket.emit("signup_response", { success: false, message: "Username already exists" });
      return;
    }

    const newUser = new UserDataModel({ username, password });
    newUser.save()
      .then(async() => {
        socket.emit("signup_response", { success: true, message: "Signup successful" , username: username });
      })
      .catch((error) => {
        console.error("Error saving user:", error);
        socket.emit("signup_response", { success: false, message: "Signup failed" });
      });
  });







    socket.on('login',async (data) => {
 

    const username=data.username;
    const password=data.password;

    var user = await UserDataModel.findOne({ username: username});

    if (!user) {
      socket.emit("login_response", { success: false, message: "User not found, Sign Up first" });
      return;
    }

    user = await UserDataModel.findOne({ username: username, password: password });
    const isPasswordValid = user?.password === password;

    if (isPasswordValid) {
      socket.emit("login_response", { success: true, message: "Login successful" , username: username });
    } else {
      socket.emit("login_response", { success: false, message: "Wrong password" });
    }
  });




  socket.on("active_me",async(data)=>{
    socket.join(data.playerName)
    active_players.set(socket.id,data.playerName)
    const user = await UserDataModel.findOne({username:data.playerName});
    if(!user){
      return;
    }

     await UserDataModel.updateOne({username:data.playerName},{active:true});

    const friends=await UserDataModel.findOne({username:data.playerName}).select({friends:1,_id:0})
    for(let i=0; i < friends!.friends.length; i++){
      socket.to(friends?.friends[i].friendName).emit("active",data.playerName);
    }
  })


  socket.on("check_myRoom",(data)=>{
    const {myRoomID,myName}=data;

    if(rooms.has(myRoomID)){

      var the_room=rooms.get(myRoomID);
      var the_board=the_room?.board;
      var start_time = the_room?.start_time;
      var duration= the_room?.duration;
      let total_time = 0;
      if (start_time instanceof Date) {
        total_time = Math.floor((new Date().getTime() - start_time.getTime()) / 1000);
      }
      var time1;
      var time2;

      if(the_room?.player1_name===myName){
        the_room!.player1_socketID=socket.id;
        io.sockets.sockets.get(socket.id)?.join(myRoomID);        
        io.sockets.sockets.get(rooms.get(myRoomID)?.player2_socketID)?.join(myRoomID);
        if(the_room?.player1_turn){
           time1= the_room?.player1_time-(total_time+the_room?.player1_time+the_room?.player2_time-120*duration);
           time2= the_room?.player2_time;
        }
        else{
           time1=the_room?.player1_time;
           time2=the_room?.player2_time-(total_time+the_room?.player1_time+the_room?.player2_time-120*duration);
        }

        console.log(time1,time2)
        socket.emit("check_myRoom_response",{the_board:the_board,myTurn:the_room?.player1_turn,myScore:the_room?.player1_score,
          opScore:the_room?.player2_score,opName:the_room?.player2_name,matchStatus:the_room?.active_status,first_player:true,
        time_1:time1,time_2:time2})

      }
      else{
        the_room!.player2_socketID=socket.id;
        io.sockets.sockets.get(socket.id)?.join(myRoomID);        
        io.sockets.sockets.get(rooms.get(myRoomID)?.player1_socketID)?.join(myRoomID);
        if(the_room?.player2_turn){
           time1= the_room?.player2_time-(total_time+the_room?.player1_time+the_room?.player2_time-120*duration);
           time2= the_room?.player1_time;
        }
        else{
           time1=the_room?.player2_time;
           time2=the_room?.player1_time-(total_time+the_room?.player1_time+the_room?.player2_time-120*duration);
        }
        console.log(time1,time2)
        socket.emit("check_myRoom_response",{the_board:the_board,myTurn:the_room?.player2_turn,myScore:the_room?.player2_score,
          opScore:the_room?.player1_score,opName:the_room?.player1_name,matchStatus:the_room?.active_status,first_player:false,
        time_1:time1,time_2:time2})


      }


      socket.emit("game_restored_response",duration);
        
      // socket.to(myRoomID).emit("check_myRoom_response",rooms.get(myRoomID)?.board)
      
    
    }

  })


  socket.on("join_game", async (data) => {
    const { username } = data;
    const playerData = await UserDataModel.findOne({ username: username });
    if (playerData) {
      setTimeout(() => {
        socket.emit("join_game_response", { success: true, message: "Joined game successfully", winNumber: playerData.winNumber, lossNumber: playerData.lossNumber });
      }, 200);
    } else {
      socket.emit("join_game_response", { success: false, message: "User not found" });
      console.log("User not found: ".concat(username));
    }
  });




  socket.on("new_game", async (data) => {
    const { username, playerLevel, selectedDuration } = data; 
    console.log("New game requested by:", username, selectedDuration);

    if (waiting_players.length === 0) {
      waiting_players.push({
        username: username, 
        socketId: socket.id,
        level: playerLevel,
        duration: selectedDuration
      });

      socket.emit("new_game_waiting_response");

      return;
    } 


    let found_match=false;
    for(let i=0;i<waiting_players.length;i++){
      if(waiting_players[i].duration === selectedDuration){
        found_match=true;
        break;
      }
    }

    if(!found_match){
      socket.emit("new_game_waiting_response");
      return;
    }

      waiting_players.push({
        username: username,
        socketId: socket.id,
        level: playerLevel,
        duration: selectedDuration
      });
  


    let level_diff = 100000;
    let opponent;
    let opponent_name;
    let opponent_socketId;

    for(let i=0;i<waiting_players.length;i++){
      if(waiting_players[i].username !== username){
        let curr_diff = Math.abs(waiting_players[i].level - playerLevel);
        if(curr_diff < level_diff){
          level_diff = curr_diff;
          opponent = waiting_players[i];
          opponent_name = waiting_players[i].username;
          opponent_socketId = waiting_players[i].socketId;
        }
      }
    }

    console.log("opponent: ",opponent)

    if(opponent){

      startNewGame(socket,username,opponent_name,opponent_socketId,selectedDuration);
 
      for(let i=0;i<waiting_players.length;i++){
        if(waiting_players[i].username === username || waiting_players[i].username === opponent_name){
          waiting_players.splice(i, 1);
          i--;
        }
      }
    

    }

  });

  socket.on("deleteFromWaiting",()=>{
    for(let i=0;i<waiting_players.length;i++){
      if(waiting_players[i].socketId === socket.id){
        waiting_players.splice(i, 1);
        i--;
      }
    }
  });

  
  socket.on("playAgain",(data)=>{
    if(playAgainWaiting.has(data.roomID)){
      const the_room=rooms.get(data.roomID);
      the_room!.active_status=true;
      the_room!.player1_time=data.duration*60;
      the_room!.player2_time=data.duration*60;
      the_room!.start_time=new Date();
      the_room!.current_turn_start_time=new Date();
      the_room!.duration=data.duration;
      socket.to(data.roomID).emit("playAgain_response",true);
      socket.emit("playAgain_response",true);
      playAgainWaiting.delete(data.roomID)
    }
    else{
      playAgainWaiting.set(data.roomID,data.username)
    }
  })


  socket.on("time_up",(data)=>{

    if(time_up_check.has(data.roomID)){
      time_up_check.delete(data.roomID)
      return;
    }
    time_up_check.set(data.roomID,data.username)

    if(!playAgainWaiting.has(data.roomID)){
      socket.to(data.roomID).emit("opponent_left", { message: "Both left the game." });
      socket.emit("opponent_left", { message: "Both left the game." });
    }
    else{
      if(playAgainWaiting.get(data.roomID)===data.username){
        socket.to(data.roomID).emit("opponent_left", { message: "Time up for the game." });
        socket.emit("opponent_left", { message: "Your opponent has left the game." });
      }
      else{
        socket.emit("opponent_left", { message: "Time up for the game." });
        socket.to(data.roomID).emit("opponent_left", { message: "Your opponent has left the game." });   
      }
    }

    updateDatabase(rooms.get(data.roomID),data.username)


    playAgainWaiting.delete(data.roomID)
    rooms.delete(data.roomID)
    socket.leave(data.roomID);


  })


  socket.on("leave_game", async (data) => {
    const { username, roomID, matchActive,duration,leaveAndPlay } = data;
    var the_room=rooms.get(roomID);
    const user1 = await UserDataModel.findOne({ username: username });
    const opponent=the_room?.player1_name===username ? the_room?.player2_name : the_room?.player1_name; 
    const user2 = await UserDataModel.findOne({ username: opponent });

    if(!user1 || !user2)  return;

    if (matchActive) {
      
      await UserDataModel.updateOne(
        { username: username },
        { $set: { lossNumber: (user1.lossNumber || 0) + 1 } }
      );
      await UserDataModel.updateOne(
        { username: opponent },
        { $set: { winNumber: (user2.winNumber || 0) + 1 } } 
      );

      if(username===the_room?.player1_name){
        the_room!.player2_score+=1;
      }
      else{
        the_room!.player1_score+=1;
      }
    }

    updateDatabase(the_room,username)


    socket.leave(roomID);
    if(playAgainWaiting.has(roomID)){
      playAgainWaiting.delete(roomID)
    }
    console.log(username, "left the game in room:", roomID);
    socket.to(roomID).emit("opponent_left", { message: "Your opponent has left the game." ,matchActive:matchActive});
    socket.emit("me_left", { message: "You have left the game.",matchActive:matchActive,leaveAndPlay:leaveAndPlay });
    if(rooms.has(roomID)){
      rooms.delete(roomID)
    }
  });


  socket.on("clicked_colIndex",async(data)=>{
    
    socket.broadcast.to(data.roomID).emit("click_colIndex_responce",{colIndex:data.colIndex,color:data.color})
    var the_room=rooms.get(data.roomID);
    var the_board=the_room?.board;
    const time_diff = Math.floor((new Date().getTime() - (the_room?.current_turn_start_time).getTime()) / 1000);
    the_room!.current_turn_start_time=new Date();
    const value:number=(data.color==="green")? 0 :1;
    if(value){
      the_room!.player2_time-=time_diff;
      socket.emit("stopTimer1",the_room!.player2_time)
    }
    else{
      the_room!.player1_time-=time_diff;
      socket.emit("stopTimer1",the_room!.player1_time)
    }
    // console.log(the_room)
    // console.log(data.time)
    let i:number;
    var return_value:number;
    var the_result:number[][]=[];
    for( i=1;i<7;i++){
      if(i===6 || the_board[i][data.colIndex]!==-1){
        the_board[i-1][data.colIndex]=value;
        [the_result,return_value]= check_result(i-1,data.colIndex,value,the_board);
        break;
      }
    }




    if(the_room?.player1_turn){
      the_room!.player1_turn=false;
      the_room!.player2_turn=true;
    }
    else{
      the_room!.player2_turn=false;
      the_room!.player1_turn=true;
    }

    if(return_value===-1){
      let j:number;
      for( j=0;j<7;j++){
        if(the_board[0][j]===-1) break;
      }
      if(j===7){
        the_room!.drawNumber+=1;
        socket.to(data.roomID).emit("draw");
        socket.to(data.roomID).emit("makeTurnTrue_response",{time_1:0,time_2:0})
        socket.emit("draw");
        return;
      }
    }


    if(return_value!==-1){

      if(value===0){
        const user1 = await UserDataModel.findOne({ username: the_room?.player1_name });
        const user2 = await UserDataModel.findOne({ username: the_room?.player2_name });
        if (!user1 || !user2) return;
        await UserDataModel.updateOne(
          { username: the_room?.player1_name },
          { $set: { winNumber: (user1.winNumber || 0) + 1 } }
        );
        await UserDataModel.updateOne(
          { username: the_room?.player2_name },
          { $set: { lossNumber: (user2.lossNumber || 0) + 1 } }
        );
        the_room!.player1_score+=1;

      }
      else if(value===1){
        const user1 = await UserDataModel.findOne({ username: the_room?.player1_name });
        const user2 = await UserDataModel.findOne({ username: the_room?.player2_name });
        if (!user1 || !user2) return;
        await UserDataModel.updateOne(
          { username: the_room?.player1_name },
          { $set: { lossNumber: (user1.lossNumber || 0) + 1 } }
        );
        await UserDataModel.updateOne(
          { username: the_room?.player2_name },
          { $set: { winNumber: (user2.winNumber || 0) + 1 } }
        );
        the_room!.player2_score+=1;
      }

      clearBoard(the_board);
      the_room!.active_status=false;
      the_room!.player1_time=data.duration*60;
      the_room!.player2_time=data.duration*60;


      setTimeout(() => {
         console.log(the_result,return_value)
         socket.to(data.roomID).emit("showResult_response",{the_result,return_value})
         socket.emit("showResult_response",{the_result,return_value})
      }, (i+1)*150);
      

    }


    if(return_value===-1){
      setTimeout(() => {
        socket.broadcast.to(data.roomID).emit("makeTurnTrue_response",{time_1:the_room?.player1_time,time_2:the_room?.player2_time})
        if(value){
          socket.emit("startTimer2",the_room?.player1_time)
        }
        else{
          socket.emit("startTimer2",the_room?.player2_time)
        }
        
      }, (i+1)*150);
    }
    else{
      setTimeout(() => {
        socket.broadcast.to(data.roomID).emit("makeTurnTrue_response",{time_1:the_room?.player1_time,time_2:the_room?.player2_time})
      }, (i+5)*150);      
    }

    


  })


  socket.on("game_time_up",async(data)=>{
    if(game_time_up_check.has(data.roomID)){
      game_time_up_check.delete(data.roomID)
      return;
    }

    game_time_up_check.set(data.roomID,data.value)

    var the_room=rooms.get(data.roomID);
    if(!the_room?.active_status) return;
    var player;
    var opponent;
    var user1;
    var user2;
    if(data.firstPlayer){
       player= the_room?.player1_name;
       opponent= the_room?.player2_name; 
       user1 = await UserDataModel.findOne({ username: player});
       user2 = await UserDataModel.findOne({ username: opponent});
       if(data.value===1){
        the_room!.player2_score+=1;
        socket.to(data.roomID).emit("showResult_response",{the_result:null,return_value:1})
        socket.emit("showResult_response",{the_result:null,return_value:1})
       }
       else{
        the_room!.player1_score+=1;
        socket.to(data.roomID).emit("showResult_response",{the_result:null,return_value:0})
        socket.emit("showResult_response",{the_result:null,return_value:0})
       }
    }
    else{
       player= the_room?.player2_name;
       opponent= the_room?.player1_name; 
       user1 = await UserDataModel.findOne({ username: player});
       user2 = await UserDataModel.findOne({ username: opponent});
       if(data.value===1){
        the_room!.player1_score+=1;
        socket.to(data.roomID).emit("showResult_response",{the_result:null,return_value:0})
        socket.emit("showResult_response",{the_result:null,return_value:0})
       } 
       else{
        the_room!.player2_score+=1;
        socket.to(data.roomID).emit("showResult_response",{the_result:null,return_value:1})
        socket.emit("showResult_response",{the_result:null,return_value:1})
       }     
    }


  if (user1 && user2) {

    await UserDataModel.updateOne(
      { username: opponent },
      { $set: { winNumber: (user2.winNumber || 0) + 1 } }
    );
    await UserDataModel.updateOne(
      { username: player },
      { $set: { lossNumber: (user1.lossNumber || 0) + 1 } }
    ); 


      the_room!.active_status=false;
      the_room!.player1_time=60;
      the_room!.player2_time=60;
      clearBoard(the_room!.board);
  }
  })


  socket.on("requestFriend",(data)=>{
    console.log(data)
    socket.to(data.roomID).emit("requestFriend_response",{playerName:data.playerName})
    socket.emit("requestFriend_response_me");
  })


  socket.on("acceptFriendRequest",async(data)=>{
    const user1= await UserDataModel.findOne({username:data.playerName});
    const user2= await UserDataModel.findOne({username:data.opponent});
    const friend1={
      friendName:user2?.username,
    }
    const friend2={
      friendName:user1?.username,
    }
    user1?.friends.push(friend1)
    user1?.save()
    user2?.friends.push(friend2)
    user2?.save()
    socket.to(data.roomID).emit("acceptFriendRequest_response",{playerName:data.playerName})
    socket.emit("acceptFriendRequest_response_me");

  })


  socket.on("denyFriendRequest",(data)=>{
    socket.to(data.roomID).emit("denyFriendRequest_response",{playerName:data.playerName})
    socket.emit("denyFriendRequest_response_me");

  })



  socket.on("requestFriendToPlay",(data)=>{
    socket.to(data.friendName).emit("requestFriendToPlay_response",{friendName:data.playerName,friendSocketID:socket.id,duration:data.duration})
  })


  socket.on("playWithFriend",(data)=>{
    const {playerName,friendSocketID,friend,duration}=data;

    startNewGame(socket,playerName,friend,friendSocketID,duration)
    
  })


  socket.on("unfriend",async(data)=>{
    const {playerName,friendName,index} =data;
    await UserDataModel.updateOne({username:playerName},
      {
        $pull:{
          friends:{
            friendName:friendName
          }
        }
      }
    )
    await UserDataModel.updateOne({username:friendName},
      {
        $pull:{
          friends:{
            friendName:playerName
          }
        }
      }
    )

    socket.to(friendName).emit("upfriend_response",playerName);
    socket.emit("upfriend_response_me",{index,friendName});

    
  })



  socket.on("playLater",(data)=>{
    socket.to(data.friendName).emit("playLater_response",{friendName:data.playerName})
  })


  socket.on("disconnecting",async () => {
    var roomID;
    var who_leave;
    rooms.forEach((room)=>{
      if(room.player1_socketID===socket.id){
        roomID=room.roomID;
        room.player1_socketID=null;
        who_leave=room.player1_name;
      }
      else if(room.player2_socketID===socket.id){
         roomID=room.roomID;
        room.player2_socketID=null;
        who_leave=room.player2_name;
      }
    })



    const index = waiting_players.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      waiting_players.splice(index, 1);
    }


      await UserDataModel.updateOne({username:active_players.get(socket.id)},{active:false});
      const friends=await UserDataModel.findOne({username:active_players.get(socket.id)}).select({friends:1})
      if (friends?.friends && friends.friends.length > 0) {
        for(let i=0;i<friends.friends.length;i++){
          socket.to(friends.friends[i].friendName).emit("inActive",active_players.get(socket.id));
        }
      }

  setTimeout(() => {


    const the_room = rooms.get(roomID);

    if (the_room && (the_room.player1_socketID === null || the_room.player2_socketID === null)) {
      socket.to(roomID).emit("opponent_left", { message: "Your opponent has disconnected.", matchActive: the_room.active_status });

      if (the_room.active_status) {
        Promise.all([
          UserDataModel.findOne({ username: the_room?.player1_name }),
          UserDataModel.findOne({ username: the_room?.player2_name })
        ]).then(([user1, user2]) => {
          if (!user1 || !user2) return;
          if (who_leave === the_room.player1_name) {
            UserDataModel.updateOne(
              { username: the_room?.player1_name },
              { $set: { lossNumber: (user1.lossNumber || 0) + 1 } }
            ).then(() => {
            });
            UserDataModel.updateOne(
              { username: the_room?.player2_name },
              { $set: { winNumber: (user2.winNumber || 0) + 1 } }
            ).then(() => {
              the_room!.player2_score += 1;
            });
          } else {
            UserDataModel.updateOne(
              { username: the_room?.player1_name },
              { $set: { winNumber: (user1.winNumber || 0) + 1 } }
            ).then(() => {
              the_room!.player1_score += 1;
            });
            UserDataModel.updateOne(
              { username: the_room?.player2_name },
              { $set: { lossNumber: (user2.lossNumber || 0) + 1 } }
            ).then(() => {
            });

          }

          
          clearBoard(the_room!.board);
          the_room!.active_status = false;
          the_room!.player1_time = 0;
          the_room!.player2_time = 0;
        });
      }

      updateDatabase(the_room,who_leave)


      if (rooms.has(roomID)) {
        rooms.delete(roomID);
      }

      if (playAgainWaiting.has(roomID)) {
        playAgainWaiting.delete(roomID);
      }
      socket.leave(roomID);
    }

  }, 20000);


  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


const PORT = process.env.MYPORT ? Number(process.env.MYPORT) : 6400;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});



const check_result=(row,col,value,board)=>{
    let resultCells:number[][]=[];
    let count=0;
    let j=0;
    resultCells.push([row,col]);
    for(let i=col-1;i>=0 && j<3;i--,j++){
        if(board[row][i]===value){
            count++;
            resultCells.push([row,i])
        }
        else{
            break;
        }
    }
    j=0;
    for(let i=col+1;i<7 && j<3;i++,j++){
        if(board[row][i]===value){
          resultCells.push([row,i])
            count++;

        }
        else{
            break;
        }
    }
    if(count>=3){
        return [resultCells,value];
    }


    //up-down
    resultCells=[];
    resultCells.push([row,col]);
    count=0;
    j=0;
    for(let i=row+1;i<6 && j<3;i++,j++){
        if(board[i][col]===value){
          resultCells.push([i,col])
            count++;

        }
        else{
            break;
        }
    }
    if(count>=3){
        return [resultCells,value];
    }

    // 1st corner
    resultCells=[];
    resultCells.push([row,col]);
    count=0;
    let k=0;
    for(let i=row-1,j=col-1;i>=0 && j>=0 && k<3;i--,j--,k++){
        if(board[i][j]===value){
            count++;
            resultCells.push([i,j])
        }
        else{
            break;
        }
    }
    k=0;
    for(let i=row+1,j=col+1;i<6 && j<7 && k<3;i++,j++,k++){
        if(board[i][j]===value){
            count++;
            resultCells.push([i,j])
        }
        else{
            break;
        }
    }
    if(count>=3){
        return [resultCells,value];
    }


    //2nd corner
    resultCells=[];
    resultCells.push([row,col]);
    count=0;
    k=0;
    for(let i=row-1,j=col+1;i>=0 && j<7 && k<3;i--,j++,k++){
        if(board[i][j]===value){
            count++;
            resultCells.push([i,j])
        }
        else{
            break;
        }
    }
    k=0;
    for(let i=row+1,j=col-1;i<6 && j>=0 && k<3;i++,j--,k++){
        if(board[i][j]===value){
            count++;
            resultCells.push([i,j])
        }
        else{
            break;
        }
    }
    if(count>=3){
        return [resultCells,value];
    }

    return [resultCells,-1];
}



const clearBoard=(board)=>{
  for(let i=0;i<6;i++){
    for(let j=0;j<7;j++){
      board[i][j]=-1;
    }
  }
}


const updateDatabase=async(the_room,who_leave)=>{

    const user1 = await UserDataModel.findOne({ username: who_leave });
    const opponent=the_room?.player1_name===who_leave ? the_room?.player2_name : the_room?.player1_name; 
    const user2 = await UserDataModel.findOne({ username: opponent });
    const myScore=who_leave===the_room?.player1_name ? the_room.player1_score:the_room?.player2_score;
    const opponentScore=who_leave===the_room?.player1_name ? the_room.player2_score:the_room?.player1_score;
    const now:Date= new Date();



    const myHistory= {
      opponent:opponent,
      myScore:myScore,
      opponentScore:opponentScore,
      totalMatch:the_room?.player1_score+the_room?.player2_score+the_room?.drawNumber,
      matchDuration:the_room?.duration,
      playedTime: now
    }

    const oppHistory= {
      opponent:who_leave,
      myScore:opponentScore,
      opponentScore:myScore,
      totalMatch:the_room?.player1_score+the_room?.player2_score+the_room?.drawNumber,
      matchDuration:the_room?.duration,
      playedTime: now
    }

  

    user1?.histories.push(myHistory);
    await user1?.save();
    user2?.histories.push(oppHistory);
    await user2?.save();


}


const startNewGame=async(socket,username,opponent_name,opponent_socketId,selectedDuration)=>{

      let roomID = username + "#" + opponent_name + "#" + Date.now();
      io.sockets.sockets.get(opponent_socketId)?.join(roomID);
      io.sockets.sockets.get(socket.id)?.join(roomID);
      io.to(opponent_socketId).emit("found_match", { opponent: username, roomID: roomID,duration: selectedDuration });
      io.to(socket.id).emit("found_match", { opponent: opponent_name, roomID: roomID,duration: selectedDuration });
      const user= await UserDataModel.findOne({username:username});
      const friendList=user?.friends;
      let friendFound=false;
      for(let i=0;i<friendList?.length;i++){
        if(friendList[i].friendName===opponent_name){
          friendFound=true;
          break;
        }
      }
      setTimeout(() => {
        io.to(socket.id).emit("game_start", { roomID: roomID, players: [username, opponent_name], turn: false, duration: selectedDuration,friendFound:friendFound });
        io.to(opponent_socketId).emit("game_start", { roomID: roomID, players: [opponent_name, username], turn: true, duration: selectedDuration,friendFound:friendFound });
        console.log(socket.id,opponent_socketId,socket.rooms)
      }, 1000);
      for(let i=0;i<waiting_players.length;i++){
        if(waiting_players[i].username === username || waiting_players[i].username === opponent_name){
          waiting_players.splice(i, 1);
          i--;
        }
      }
    



    const newRoom:Room={
      roomID:roomID,
      player1_socketID:opponent_socketId,
      player2_socketID:socket.id,
      player1_name:opponent_name,
      player2_name:username,
      player1_score:0,
      player2_score:0,
      board:Array(6).fill(null).map(() => Array(7).fill(-1)),
      active_status:true,
      player1_turn:true,
      player2_turn:false,
      player1_time:selectedDuration*60,
      player2_time:selectedDuration*60,
      start_time:new Date(),
      current_turn_start_time:new Date(),
      duration:selectedDuration,
      drawNumber:0

    }




    if(!rooms.has(roomID)){
      rooms.set(roomID,newRoom)
    }

}