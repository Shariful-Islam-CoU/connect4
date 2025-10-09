import { useEffect,useState } from 'react';
import '../css/game.css';
import socket from '../../../server/socket.ts';
import { ToastContainer, toast } from 'react-toastify';
import AlertDialog from '../header/alertDialog';
import AlertDialog2 from '../header/alertDialog2';
import { Link,useNavigate,useLocation  } from 'react-router-dom';
var waitTimer = null;
var firstTimeCheck=false;
var time=0;
var board: number[][] =Array(6).fill(null).map(() => Array(7).fill(-1));
var turn=true; 
var firstPlayer;
var opponent;
var gameActive=false;
var matchActive=false;
var player1_score:number=0;
var player2_score:number=0;
var timer1Interval=null;
var timer2Interval=null;
var time1:number;
var time2:number;
var roomID:string|null=null;
var duration:number=0;





const Game = () => {

    const [playerName, setPlayerName] = useState(localStorage.getItem('username') || 'Guest');
    const [playerLevel, setPlayerLevel] = useState(0);
    const [playerScore, setPlayerScore] = useState(0);
    const [numWins, setNumWins] = useState(0);
    const [numLosses, setNumLosses] = useState(0);
    const [showDialog, setShowDialog] = useState(false);
  const [requests, setRequests] = useState<GameRequest[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const {state} = location ;
    const player_Name = localStorage.getItem('username') || 'Guest';
    const durationFromHome= state ? state.durationFromHome : 0;
    const fromHome= state ? state.fromHome : false;
    duration=durationFromHome;

    console.log("durationFromHome",durationFromHome)

    setTimeout(() => {
        if(!gameActive){
            navigate('/')
        }
    }, 1000);

    socket.emit("join_game", { username: player_Name });

console.log("My turn ",turn,time1,time2,firstPlayer)

    
    const myRoomID=localStorage.getItem("myRoomID");
    if(!firstTimeCheck && fromHome===false){
        console.log("ckeck RoomID",myRoomID)
        if(myRoomID){
            socket.emit("check_myRoom",{myRoomID:myRoomID,myName:player_Name});
        }
        firstTimeCheck=true;
    }




    const handleRequestFriendBtn=()=>{
        socket.emit("requestFriend",{playerName:playerName,roomID:roomID})
        console.log("handleRequestFriendBtn is clicked")
    }

    const handleAcceptBtn=()=>{
        const acceptBtn =document.getElementById("acceptBtn");
        const denyBtn= document.getElementById("denyBtn");
        if (acceptBtn) acceptBtn.disabled = true;
        if (denyBtn) denyBtn.disabled = true;
        socket.emit("acceptFriendRequest",{playerName:playerName,opponent:opponent,roomID:roomID})
    }


    const handleDenyBtn=()=>{
        const requestFriendBtn=document.getElementById("requestFriendBtn");
        const friendRequestMsg=document.getElementById("friendRequestMsg");
        const acceptBtn =document.getElementById("acceptBtn");
        const denyBtn= document.getElementById("denyBtn");
        if (requestFriendBtn) requestFriendBtn.style.display = 'block';
        if (acceptBtn) acceptBtn.disabled = true;
        if (denyBtn) denyBtn.disabled = true;
        socket.emit("denyFriendRequest",{playerName:playerName,roomID:roomID})
    }


    const handleLeaveGame = () => {
        console.log("Leave Game button clicked");
        const btn=document.getElementById("new-game");
        if(player_Name==="Guest"){
            navigate('/home')
            return;
        }
        socket.emit("leave_game", { username: player_Name, roomID:roomID,matchActive:matchActive,duration:duration,leaveAndPlay:false });    
        
    }

    const handleRunner=(color,colIndex,roomID)=>{
        let i=0;
        const runner=(setInterval(()=>{
            if(gameActive===false){
                clearInterval(runner)
                boardClearAll();
                return;
            }
                if(i<6 && board[i][colIndex]===-1){
                    document.getElementById(`circle-${colIndex}-${i}`)!.style.backgroundColor=color;
                    if(i>0){
                        document.getElementById(`circle-${colIndex}-${i-1}`)!.style.backgroundColor="white";
                    }
                }
                else{
                    clearInterval(runner)
                    board[i-1][colIndex]=(color==="green")?0:1;
                //    const result= checkResult(i-1,colIndex,board[i-1][colIndex]);
                //    console.log(result)
                }
                i++;
            
        }, 150));
    }

    const handleColumnClick = (colIndex) => {
        console.log("Column clicked:", colIndex,firstPlayer,roomID);
        if(!gameActive){
            return;
        }
        if(board[0][colIndex]!==-1){
            // toast.error("Column is full! Choose another column.");
            return;
        }
        
        if(!turn) return;

        turn=false;

        if(firstPlayer){
            console.log("Time= ",time1)
            socket.emit("clicked_colIndex",{colIndex:colIndex,color:"green",roomID:roomID,time:time1,duration:duration});
            // stopTimer1();
            handleRunner("green",colIndex,roomID);
        }
        else{
            console.log("Time= ",time1)
            socket.emit("clicked_colIndex",{colIndex:colIndex,color:"red",roomID:roomID,time:time1,duration:duration});
            // stopTimer1();
            handleRunner("red",colIndex,roomID);
        }

    }



   const colorCells=(resultCells,value)=>{
        if(value===1){
            for(let i=0;i<4;i++){
                document.getElementById(`circle-${resultCells[i][1]}-${resultCells[i][0]}`)!.style.backgroundColor="#ff2400ff"
            }
        }
        else{
            for(let i=0;i<4;i++){
                document.getElementById(`circle-${resultCells[i][1]}-${resultCells[i][0]}`)!.style.backgroundColor="#76ff32ff"
            }
        }

        setTimeout(() => {
            boardClearAll();
        }, 1000);
        

   }

   const boardClearAll=()=>{
      board = Array(6).fill(null).map(() => Array(7).fill(-1));

      for(let i=0;i<6;i++){
        for(let j=0;j<7;j++){
            const circle=document.getElementById(`circle-${j}-${i}`);
            if(circle){
                circle!.style.backgroundColor="white";
            }
        }
      }
   }



   const updateData=(value)=>{
        stopTimer1()
        stopTimer2()
        matchActive=false;
        time1=duration*60;
        time2=duration*60;
        document.getElementById("timer1")!.innerHTML=`0${Math.floor(time1/60)}:${time1%60}`;
        document.getElementById("timer2")!.innerHTML=`0${Math.floor(time2/60)}:${time2%60}`;
        if(value===-2){
            toast.info("Draw the game")
        }
        else if( firstPlayer===true){
            if(value===0){
                setNumWins((prev) => prev + 1)
                player1_score++;
                document.getElementById("player1_score")!.innerText=`${player1_score}`
                toast.info("You win the game")
            }
            else{
                console.log("before loss",numLosses)
                setNumLosses((prev) => prev + 1)
                console.log("after loss",numLosses)

                player2_score++;
                document.getElementById("player2_score")!.innerText=`${player2_score}`
                toast.info("You loss the game")
            }
            
        }
        else{
            if(value===1){
                setNumWins((prev) => prev + 1)
                player1_score++;
                document.getElementById("player1_score")!.innerText=player1_score;
                toast.info("You win the game")
            }
            else{
                setNumLosses((prev) => prev + 1)
                player2_score++;
                document.getElementById("player2_score")!.innerText=player2_score;
                toast.info("You loss the game")
            }
        }

        setTimeout(() => {
           setShowDialog(true)  
        }, 1000);

   }

   const startTimer1=()=>{
     console.log("timer1 started",roomID)
        const timer1=document.getElementById("timer1");
        timer1Interval=setInterval(() => {
            time1--;
            if(time1<=0){
                boardClearAll();
                stopTimer1();
                socket.emit("game_time_up",{firstPlayer:firstPlayer,value:1,roomID:roomID,duration:duration})
            }
            timer1.innerText=`0${Math.floor(time1/60)}:${time1%60}`
        }, 1000);
   }


   const startTimer2=()=>{
        console.log("timer2 started",roomID)

        const timer2=document.getElementById("timer2");
        timer2Interval=setInterval(() => {
            time2--;
            if(time2<=0){
                boardClearAll();
                stopTimer2();
                socket.emit("game_time_up",{firstPlayer:firstPlayer,value:2,roomID:roomID,duration:duration})
            }
            timer2.innerText=`0${Math.floor(time2/60)}:${time2%60}`
        }, 1000);
   }

   const stopTimer1=()=>{
    clearInterval(timer1Interval)
    console.log("timer1 stopped")

   }

   const stopTimer2=()=>{
    clearInterval(timer2Interval)
    console.log("timer2 stopped")

   }

   const clearAllInfo=()=>{
    stopTimer1()
    stopTimer2()
            document.getElementById("player1-name")!.innerText="Player1"
            document.getElementById("player2-name")!.innerText="Player2"
            document.getElementById("player1-avatar")!.innerText="P"
            document.getElementById("player2-avatar")!.innerText="P"
            document.getElementById("timer1")!.innerText=`${duration}:00`
            document.getElementById("timer2")!.innerText=`${duration}:00`
            document.getElementById("player1_score")!.innerText="0"
            document.getElementById("player2_score")!.innerText="0"
            time1=duration*60;
            time2=duration*60;
            player1_score=0;
            player2_score=0;
   }

  const handleYes = () => {
    socket.emit("playAgain",{ username: player_Name, roomID:roomID ,duration:duration});

  };

  const handleLeave = () => {
     leaveGame("leave_game");

  };

  const handleTimeout = () => {
     leaveGame("time_up");
  };



  const leaveGame=(msg)=>{
    setShowDialog(false)
    socket.emit(msg, { username: player_Name, roomID:roomID,matchActive:matchActive ,duration:duration,leaveAndPlay:false});
    clearAllInfo()
    boardClearAll()
    document.getElementById("new-game")!.innerText="New Game"
  }

  const handleJoin=(req:GameRequest)=>{
    socket.emit("leave_game", { username: player_Name, roomID:roomID,matchActive:matchActive,duration:duration,leaveAndPlay:true });  
    setTimeout(() => {
            socket.emit("playWithFriend",{playerName:player_Name,friendSocketID:req.id,friend:req.from,duration:req.duration})
    }, 1500);  

  }





















useEffect(()=>{

    socket.on("check_myRoom_response",(data)=>{

        const {the_board,myTurn,myScore,opScore,opName,matchStatus,first_player,time_1,time_2}=data;
        console.log(data)

        document.getElementById("new-game").innerText="Leave Game";
        toast.info("Game restored")
        gameActive=true;
        matchActive=matchStatus;
        turn=myTurn;
        firstPlayer=first_player;
        roomID=myRoomID;
        document.getElementById("player1-name")!.innerText=player_Name
        document.getElementById("player2-name")!.innerText=opName
        document.getElementById("player1-avatar")!.innerText=player_Name.charAt(0).toUpperCase();
        document.getElementById("player2-avatar")!.innerText=opName.charAt(0).toUpperCase();
        // document.getElementById("timer1")!.innerText="01:00"
        // document.getElementById("timer2")!.innerText="01:00"
        document.getElementById("player1_score")!.innerText=myScore;
        document.getElementById("player2_score")!.innerText=opScore;
        document.getElementById("player1-avatar").style.backgroundColor=(firstPlayer)?  "green":"red"
        document.getElementById("player2-avatar").style.backgroundColor=(firstPlayer)?  "red":"green"
        console.log(time1,time2)

        if(firstPlayer){
            time1=time_1;
            time2=time_2;
            document.getElementById("timer1")!.innerText=`0${Math.floor(time1/60)}:${time1%60}`;
            document.getElementById("timer2")!.innerText=`0${Math.floor(time2/60)}:${time2%60}`;
            if(turn){
                document.getElementById("timer1").style.color="green"
                document.getElementById("timer2").style.color="#c3a2a2ff"
            }
            else{
                document.getElementById("timer1").style.color="#5a945cff"
                document.getElementById("timer2").style.color="red"
            }
        }
        else{
            time1=time_1;
            time2=time_2
            document.getElementById("timer1")!.innerText=`0${Math.floor(time1/60)}:${time1%60}`;
            document.getElementById("timer2")!.innerText=`0${Math.floor(time2/60)}:${time2%60}`;
            if(turn){
                document.getElementById("timer1").style.color="red"
                document.getElementById("timer2").style.color="#5a945cff"
            }
            else{
                document.getElementById("timer1").style.color="#c3a2a2ff"
                document.getElementById("timer2").style.color="green"
            }
        }

        console.log(time_1,time_2)


        if(turn){
            toast.info("It's your turn")
            startTimer1()
            stopTimer2()
        }
        else{
            toast.info("It's opponent's turn")
            startTimer2()
            stopTimer1()
        }



        for(let i=0;i<6;i++){
            for(let j=0;j<7;j++){
                board[i][j]=the_board[i][j];
                if(board[i][j]===0){
                    document.getElementById(`circle-${j}-${i}`)!.style.backgroundColor="green";
                }
                else if(board[i][j]===1){
                    document.getElementById(`circle-${j}-${i}`)!.style.backgroundColor="red";
                }
                else{
                    document.getElementById(`circle-${j}-${i}`)!.style.backgroundColor="white";
                }
            }
        }


        
    })


    return () => {
    socket.off("check_myRoom_response");
    };



},[])



useEffect(() => {
    if (player_Name) {
        setPlayerName(player_Name);
    }


    socket.on("game_start", (data) => {
        console.log("Game started with data:", data);
        localStorage.setItem("myRoomID",data.roomID)
        turn=data.turn;
        firstPlayer=data.turn
        opponent=data.players[1];
        gameActive=true;
        matchActive=true;
        clearInterval(waitTimer);
        time=30;
        time1=data.duration*60;
        time2=data.duration*60;
        duration=data.duration;
        document.getElementById("timer1")!.innerText=`0${Math.floor(time1/60)}:${time1%60}`;
        document.getElementById("timer2")!.innerText=`0${Math.floor(time2/60)}:${time2%60}`;
        if(turn){
            document.getElementById("timer1").style.color="green"
            document.getElementById("timer2").style.color="#c3a2a2ff"
        }
        else{
            document.getElementById("timer1").style.color="#c3a2a2ff"
            document.getElementById("timer2").style.color="green"
        }
        if(data.turn){
            toast.info("It's your turn");
            startTimer1();
            stopTimer2();
            document.getElementById("player1-avatar").style.backgroundColor="green"
            document.getElementById("player2-avatar").style.backgroundColor="red"

        }
        else{
            toast.info("It's opponent's turn");
            startTimer2();
            stopTimer1();
            document.getElementById("player2-avatar").style.backgroundColor="green"
            document.getElementById("player1-avatar").style.backgroundColor="red"
        }
        const btn=document.getElementById("new-game");
        if(btn){
            btn.removeAttribute("disabled");
            btn!.innerText = "Leave Game";
        }
        
        roomID=data.roomID;

        setTimeout(() => {
            console.log("start....",data.roomID,roomID)
        }, 1000);

        

        const player1=document.getElementById('player1-name')
        const player2=document.getElementById("player2-name")
        const player1_avatar=document.getElementById('player1-avatar')
        const player2_avatar=document.getElementById("player2-avatar")
        if(player_Name===data.players[0]){
            player1!.innerText=player_Name;
            player2!.innerText=data.players[1];
            player1_avatar!.innerText=player_Name.charAt(0).toUpperCase();
            player2_avatar!.innerText=data.players[1].charAt(0).toUpperCase();

        }
        else{
            player1!.innerText=player_Name;
            player2!.innerText=data.players[0];
            player1_avatar!.innerText=player_Name.charAt(0).toUpperCase();
            player2_avatar!.innerText=data.players[0].charAt(0).toUpperCase();
        }


        if(data.friendFound){
            document.getElementById("friendRequest")!.style.display='none'
        }




    });

    return () => {
      socket.off("game_start");
    };


}, []);





useEffect(()=>{

    socket.on("opponent_left",(data)=>{
        toast.info(data.message);
        const btn=document.getElementById("new-game");
        if(btn){
            btn!.style.display="none";
        }
        clearAllInfo()

        stopTimer1()
        stopTimer2()
        gameActive=false;
        document.getElementById("player1-avatar").style.backgroundColor="#3498db"
        document.getElementById("player2-avatar").style.backgroundColor="#e74c3c"


        if(data.matchActive){
            setNumWins((prev) => prev + 1)
            toast.info("You win the game ")
        }

        boardClearAll()
        setShowDialog(false);

        setTimeout(() => {
            navigate('/home');
        }, 1000);





    })

    return () => {
      socket.off("opponent_left");
    };

},[])


useEffect(()=>{

    socket.on("me_left",(data)=>{

        if(data.matchActive){
            console.log("before loss",numLosses)
            setNumLosses((prev) => prev + 1)
            console.log("after loss",numLosses)
            toast.info("You loss the game")
        }
        boardClearAll()
        document.getElementById("player1-avatar").style.backgroundColor="#3498db"
        document.getElementById("player2-avatar").style.backgroundColor="#e74c3c"
        document.getElementById("timer1").style.color="#3498db"
        document.getElementById("timer2").style.color="#e74c3c"
        localStorage.removeItem("myRoomID")
        clearAllInfo()
        
        matchActive=false;
        clearInterval(waitTimer);

        console.log("leaveAndPlay",data.leaveAndPlay)

        setTimeout(() => {
            if(data.leaveAndPlay===false){
                gameActive=false;
                navigate('/home');
            }
            else{
                gameActive=true;
            }
            
        }, 1000);
    });

    return () => {
      socket.off("me_left");
    };

},[])


useEffect(() => {
        socket.on("join_game_response", (data) => {
            console.log("join_game_response",data)
        if (data.success) {
            setNumWins(data.winNumber);
            setNumLosses(data.lossNumber);
        } else {
            console.error("Failed to join game:", data.message);
        }




        
    });

    return () => {
      socket.off("join_game_response");
    };

}, []);


useEffect(()=>{
   socket.on("click_colIndex_responce",(data)=>{
    console.log("click_colIndex_responce")

        handleRunner(data.color,data.colIndex)
   }) 

    return () => {
      socket.off("click_colIndex_responce");
    };
},[])

useEffect(()=>{
    socket.on("makeTurnTrue_response",(data)=>{
        const {time_1,time_2}=data;
    turn=true;

    if(matchActive){
        startTimer1()
        stopTimer2()
        if(firstPlayer){
            document.getElementById("timer1").style.color="green"
            document.getElementById("timer2").style.color="#c3a2a2ff"
        }
        else{
            document.getElementById("timer1").style.color="red"
            document.getElementById("timer2").style.color="#5a945cff"
            
        }
    }

    console.log("Time= ",time_1,time_2,firstPlayer)

    if(firstPlayer){
        time1=time_1;
        document.getElementById("timer1")!.innerText=`0${Math.floor(time1/60)}:${time1%60}`;
        time2=time_2;
        document.getElementById("timer2")!.innerText=`0${Math.floor(time2/60)}:${time2%60}`;
    }
    else{
        time2=time_1;
        document.getElementById("timer2")!.innerText=`0${Math.floor(time2/60)}:${time2%60}`;
        time1=time_2;
        document.getElementById("timer1")!.innerText=`0${Math.floor(time1/60)}:${time1%60}`;
    }




    })


    return () => {
      socket.off("makeTurnTrue_response");
    };


},[])


useEffect(()=>{
    socket.on("playAgain_response",(bool)=>{
        setShowDialog(false)
        if(turn){
            toast.info("It's your turn")
            startTimer1()
            stopTimer2()
            if(firstPlayer){
                document.getElementById("timer1").style.color="green"
                document.getElementById("timer2").style.color="#c3a2a2ff"
            }
            else{
                document.getElementById("timer1").style.color="red"
                document.getElementById("timer2").style.color="#5a945cff"
                
            }
        }
        else{
            toast.info("It's opponent's turn")
            stopTimer1()
            startTimer2()
            if(firstPlayer){
                document.getElementById("timer1").style.color="#5a945cff"
                document.getElementById("timer2").style.color="red"
            }
            else{
                document.getElementById("timer1").style.color="#c3a2a2ff"
                document.getElementById("timer2").style.color="green"
                
            }
        }
        matchActive=true;



    })

    return () => {
      socket.off("playAgain_response");
    };

},[])


useEffect(()=>{
    socket.on("showResult_response",(data)=>{
        const {the_result,return_value}=data;
        console.log(the_result,return_value)
        if(the_result!==null){
            colorCells(the_result,return_value)
        }
        
        updateData(return_value)

    })



    return () => {
        socket.off("showResult_response");
    }

},[])



// useEffect(() => {
//     socket.on("new_game_waiting_response", () => {
//     const btn=document.getElementById("new-game");
//     if(btn){
//         btn.setAttribute("disabled","true");
//     }
//         time=30;
//         btn!.innerText = "Waiting... " + time;
//         time--;
//         waitTimer = setInterval(() => {
//         btn!.innerText = "Waiting... " + time;
//         time--;
//         if(time<0){
//             socket.emit("deleteFromWaiting")
//             clearInterval(waitTimer);
//             btn!.innerText = "New Game";
//             btn!.removeAttribute("disabled");
//         }
//     }, 1000);

//     });

//     return () => {
//       socket.off("new_game_waiting_response");
//     };
// }, []);



useEffect(() => {
    socket.on("startTimer2",(time)=>{
        if(matchActive){
            startTimer2();
            time2=time;
            document.getElementById("timer2")!.innerText=`0${Math.floor(time2/60)}:${time2%60}`;
            if(firstPlayer){
                document.getElementById("timer2").style.color="red";
            }
            else{
                document.getElementById("timer2").style.color="green"
            }
        }
    })

    return () => {
      socket.off("startTimer2");
    };
}, []);

useEffect(() => {
    socket.on("stopTimer1",(time)=>{
        console.log("stopTimer1 called",time)
        if(matchActive){
            stopTimer1();
            time1=time;
            document.getElementById("timer1")!.innerText=`0${Math.floor(time1/60)}:${time1%60}`;
            if(firstPlayer){
                document.getElementById("timer1").style.color="#5a945cff";
            }
            else{
                document.getElementById("timer1").style.color="#ac9393ff"
            }
            
            
        }
    })

    return () => {
      socket.off("stopTimer1");
    };
}, []);



useEffect(() => {
    socket.on("draw",()=>{
        updateData(-2)
    })

    return () => {
      socket.off("draw");
    };
}, []);




useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (matchActive) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        const handlePopState = (e) => {
            if (matchActive) {
                window.history.pushState(null, '', window.location.href);
                toast.warn("You can't leave during an active match!");
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        window.history.pushState(null, '', window.location.href);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);



useEffect(()=>{
    socket.on("requestFriend_response_me",()=>{
        const requestFriendBtn=document.getElementById("requestFriendBtn");
        const friendRequestMsg=document.getElementById("friendRequestMsg");
        if(requestFriendBtn){
            requestFriendBtn!.style.display='none';
        }
        if (friendRequestMsg) {
            friendRequestMsg.style.display = 'block';
            friendRequestMsg.innerText = "Waiting for response...";
        }
    })

    return()=>{
        socket.off("requestFriend_response_me")
    }
})

useEffect(()=>{
    socket.on("requestFriend_response",(data)=>{
        const requestFriendBtn=document.getElementById("requestFriendBtn");
        const friendRequestMsg=document.getElementById("friendRequestMsg");
        const acceptBtn =document.getElementById("acceptBtn");
        const denyBtn= document.getElementById("denyBtn");
        if(requestFriendBtn){
            requestFriendBtn!.style.display='none';
        }
        
        if (friendRequestMsg) {
            friendRequestMsg.style.display = 'block';
            friendRequestMsg.innerText = "Friend request from " + data.playerName;
        }
        if (acceptBtn) {
            acceptBtn.style.display = 'block';
            acceptBtn.disabled = false;
        }
        if (denyBtn) {
            denyBtn.style.display = 'block';
            denyBtn.disabled = false;
        }
    })

    return()=>{
        socket.off("requestFriend_response")
    }
})


useEffect(()=>{
    socket.on("acceptFriendRequest_response",(data)=>{
        const friendRequestMsg=document.getElementById("friendRequestMsg");
        
        if (friendRequestMsg) {
            friendRequestMsg.innerText = data.playerName + " accepted your request";
            setTimeout(() => {
                friendRequestMsg.style.display = 'none';
            }, 1000);
        }
    })

    return()=>{
        socket.off("acceptFriendRequest_response")
    }
})

useEffect(()=>{
    socket.on("acceptFriendRequest_response_me",()=>{
        const acceptBtn =document.getElementById("acceptBtn");
        const denyBtn= document.getElementById("denyBtn");
        const friendRequestMsg=document.getElementById("friendRequestMsg");
        acceptBtn!.style.display='none'
        denyBtn!.style.display='none'
        if (friendRequestMsg && opponent) {
            friendRequestMsg.innerText = opponent + " is added in friend list";
            setTimeout(() => {
                friendRequestMsg.style.display = 'none';
            }, 1000);
        }
    })

    return()=>{
        socket.off("acceptFriendRequest_response_me")
    }
})


useEffect(()=>{
    socket.on("denyFriendRequest_response",(data)=>{
        const requestFriendBtn=document.getElementById("requestFriendBtn");
        const friendRequestMsg=document.getElementById("friendRequestMsg");
        if (requestFriendBtn) requestFriendBtn.style.display = 'block';
        if (friendRequestMsg) {
            friendRequestMsg.innerText = data.playerName + " denied your request";
            setTimeout(() => {
                friendRequestMsg.style.display = 'none';
            }, 1000);
        }
    })

    return()=>{
        socket.off("denyFriendRequest_response")
    }
})

useEffect(()=>{
    socket.on("denyFriendRequest_response_me",()=>{
        const friendRequestMsg=document.getElementById("friendRequestMsg");
        const acceptBtn =document.getElementById("acceptBtn");
        const denyBtn= document.getElementById("denyBtn");
        if (friendRequestMsg) friendRequestMsg.style.display = 'none';
        if (acceptBtn) acceptBtn.style.display = 'none';
        if (denyBtn) denyBtn.style.display = 'none';
    })

    return()=>{
        socket.off("denyFriendRequest_response_me")
    }
})



useEffect(() => {
       socket.on("requestFriendToPlay_response", (data) => {
          console.log(data.friendName," wants to play with you in duration ",data.duration," minute")
          const id=data.friendSocketID;
      const request = { id : id, from: data.friendName,msg:" wants to play with you in duration "+data.duration+" minute",btn:true,duration:data.duration };
      setRequests((prev) => [...prev, request]);
      setTimeout(() => {
        setRequests((prev) =>{
          const stillExits=prev.find((r)=>r.id===id);
          if(stillExits){
            // console.log("no_response")
            // socket.emit("no_response",{ opponentID: data.currentPlayerID, userName: userName,currentPlayer:data.currentPlayer })
          }
          return prev.filter((r) => r.id !== id);
        } );
      }, 5000);
    });

    return () => {
        socket.off("requestFriendToPlay_response");
    };
}, []);















    return (
        <div className="game">


            <div className="left">
                <div className="game-controls">
                    <button className="new-game" id="new-game" onClick={handleLeaveGame}>Leave Game</button>
                </div>
                <div className="player-data" >
                    <div>
                        <div >{playerName}</div>
                    </div>
                    <div>
                        <div >Player Level:</div>
                        <div >{Math.floor((numWins*400+numLosses*100)/500)}</div>
                    </div>
                    <div>
                        <div >Player Score:</div>
                        <div >{numWins*400+numLosses*100}</div>
                    </div>
                    <div>
                        <div >No. of Wins:</div>
                        <div >{numWins}</div>
                    </div>
                    <div>
                        <div >No. of Losses:</div>
                        <div >{numLosses}</div>
                    </div>

                </div>

                <div className="friendRequest" id="friendRequest">
                    <button className="requestFriendBtn" id="requestFriendBtn" onClick={()=>handleRequestFriendBtn()}>
                        Request Friend
                    </button>
                    <div className ="friendRequestMsg" id="friendRequestMsg" style={{display:'none'}}>
                    </div>

                    <div className="acceptDenyBtn" id="acceptDenyBtn">
                        <div className="accept-deny-row">
                            <button className="acceptBtn" id="acceptBtn" onClick={()=>handleAcceptBtn()} style={{display:'none'}}>
                                Accept
                            </button>
                            <button className="denyBtn" id="denyBtn" onClick={()=>handleDenyBtn()} style={{display:'none'}}>
                                Deny
                            </button>
                        </div>
                    </div>

                </div>


            </div>


            <div className="game-container">
                <div className="player-info">
                    <div className="player-section player1"
                    //  style={{backgroundColor:"#41fb08ff"}}
                     >
                        <div className="player-name" id="player1-name">Player 1</div>
                        <div className="player-avatar" id="player1-avatar">P1</div>
                    </div>
                    <div className="player-section player2"
                    //  style={{backgroundColor:"#ff4141ff"}}
                     >
                        <div className="player-avatar" id="player2-avatar">P2</div>
                        <div className="player-name" id="player2-name">Player 2</div>
                    </div>
                </div>

                <div className="game-status">
                    <div className="status-item player1"
                    // style={{backgroundColor:"#2c0961ff"}}
                    >
                        <div className="status-label">Timer</div>
                        <div className="status-value" id="timer1">{`${duration}:00`}</div>
                    </div>
                    <div className="status-item player1">
                        <div className="status-label">Score</div>
                        <div className="status-value" id="player1_score">0</div>
                    </div>
                    <div className="status-item player2">
                        <div className="status-label">Score</div>
                        <div className="status-value" id="player2_score">0</div>
                    </div>
                    <div className="status-item player2">
                        <div className="status-label">Timer</div>
                        <div className="status-value" id="timer2">{`${duration}:00`}</div>
                    </div>
                </div>

                <div className="board">
                    <div className="column" id="col-0" onClick={() => handleColumnClick(0)}>
                        <div className="circle" id="circle-0-0"></div>
                        <div className="circle" id="circle-0-1"></div>
                        <div className="circle" id="circle-0-2"></div>
                        <div className="circle" id="circle-0-3"></div>
                        <div className="circle" id="circle-0-4"></div>
                        <div className="circle" id="circle-0-5"></div>
                    </div>
                    <div className="column" id="col-1" onClick={() => handleColumnClick(1)}>
                        <div className="circle" id="circle-1-0"></div>
                        <div className="circle" id="circle-1-1"></div>
                        <div className="circle" id="circle-1-2"></div>
                        <div className="circle" id="circle-1-3"></div>
                        <div className="circle" id="circle-1-4"></div>
                        <div className="circle" id="circle-1-5"></div>
                    </div>
                    <div className="column" id="col-2" onClick={() => handleColumnClick(2)}>
                        <div className="circle" id="circle-2-0"></div>
                        <div className="circle" id="circle-2-1"></div>
                        <div className="circle" id="circle-2-2"></div>
                        <div className="circle" id="circle-2-3"></div>
                        <div className="circle" id="circle-2-4"></div>
                        <div className="circle" id="circle-2-5"></div>
                    </div>
                    <div className="column" id="col-3" onClick={() => handleColumnClick(3)}>
                        <div className="circle" id="circle-3-0"></div>
                        <div className="circle" id="circle-3-1"></div>
                        <div className="circle" id="circle-3-2"></div>
                        <div className="circle" id="circle-3-3"></div>
                        <div className="circle" id="circle-3-4"></div>
                        <div className="circle" id="circle-3-5"></div>
                    </div>
                    <div className="column" id="col-4" onClick={() => handleColumnClick(4)}>
                        <div className="circle" id="circle-4-0"></div>
                        <div className="circle" id="circle-4-1"></div>
                        <div className="circle" id="circle-4-2"></div>
                        <div className="circle" id="circle-4-3"></div>
                        <div className="circle" id="circle-4-4"></div>
                        <div className="circle" id="circle-4-5"></div>
                    </div>
                    <div className="column" id="col-5" onClick={() => handleColumnClick(5)}>
                        <div className="circle" id="circle-5-0"></div>
                        <div className="circle" id="circle-5-1"></div>
                        <div className="circle" id="circle-5-2"></div>
                        <div className="circle" id="circle-5-3"></div>
                        <div className="circle" id="circle-5-4"></div>
                        <div className="circle" id="circle-5-5"></div>
                    </div>
                    <div className="column" id="col-6" onClick={() => handleColumnClick(6)}>
                        <div className="circle" id="circle-6-0"></div>
                        <div className="circle" id="circle-6-1"></div>
                        <div className="circle" id="circle-6-2"></div>
                        <div className="circle" id="circle-6-3"></div>
                        <div className="circle" id="circle-6-4"></div>
                        <div className="circle" id="circle-6-5"></div>
                    </div>
                </div>
            </div>
            <div>
                <ToastContainer />
            </div>
                {showDialog && (
                    <AlertDialog onYes={handleYes} onLeave={handleLeave} onTimeout={handleTimeout} />
                )}

            <div className="notifications">
                {requests.map((req) => (
                    <div key={req.id} className="notification">
                    <p><b>{req.from}</b>{req.msg} </p>
                    <div className="actions">
                        <button style={ {display:req.btn ? "block" : "none"}} id="join" className="join" onClick={() => handleJoin(req)}>Leave & Join</button>
                        <button style={ {display: req.btn ? "block" : "none"}} id="deny" className="deny" onClick={() => handleDeny(req)}>Later</button>
                    </div>
                    </div>
                ))}
            </div>


        </div>
    );
};

export default Game;
