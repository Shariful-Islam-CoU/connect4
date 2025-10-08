import { Link,useNavigate } from 'react-router-dom';
import '../css/home.css';
import { useEffect, useRef, useState } from 'react';
import socket from '../../socket';
import { ToastContainer, toast } from 'react-toastify';
import { set } from 'mongoose';
var waitTimer = null;
var time=0;
var firstTimeCheck=false;
var matchDuration:number=1;
const matchDurations = [1,2,3,4,5,6,7,8,9,10];


const Home = () => {
  const [playerName, setPlayerName] = useState(localStorage.getItem('username') || 'Guest');
  const [playerLevel, setPlayerLevel] = useState(0);
  const [playerRanking, setPlayerRanking] = useState(0);
  const [historyBtn,setHistoryBtn]=useState("Played History");
  const [friendListBtn,setfriendListBtn]=useState("Friend List");
  const [playButtonText,setPlayButtonText]=useState<Map<string,string>>( new Map([["default","Play"]]));
  const [newBtnText,setNewBtnText]=useState("Play Online")
  const [waitingMsg,setWaitingMsg]=useState("")
  const [requests, setRequests] = useState<GameRequest[]>([]);
  const navigate = useNavigate();
  const player_Name = localStorage.getItem('username') || 'Guest';
  document.title = 'Connect 4 - Home';

  // socket.emit("join_game", { username: playerName });

  const [expanded, setExpanded] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(matchDurations[0]);
  const boxRef = useRef(null);

  // Played History state
  const [showHistory, setShowHistory] = useState(false);
  const [showFriendList,setShowFriendList]=useState(false)
  const [showNewGameBtn,setshowNewGameBtn]=useState(true)
  const [playedHistory, setPlayedHistory] = useState([]);
  const [friendList,setFriendList]= useState([])
  const [disabledUnfriend, setDisabledUnfriend] = useState<Map<string,boolean>>( new Map([["default",false]]));
  const [timers,setTimers]=useState<Map<string,number>>(new Map())
  const [waitingMsgDisplay,setWaitingMsgDisplay]=useState("none")

  const myRoomID=localStorage.getItem("myRoomID");
  if(!firstTimeCheck){
    console.log("ckeck RoomID",myRoomID)
    if(myRoomID){
      socket.emit("check_myRoom",{myRoomID:myRoomID,myName:player_Name,duration:matchDuration});
    }
    firstTimeCheck=true;
  }


  useEffect(()=>{
socket.emit("active_me",{playerName:playerName})
  },[])

  


  useEffect(() => {
    fetch(`https://connect4-vtzu.onrender.com/playerAllInfo/${playerName}`,)
      .then(response => response.json())
      .then(data => {
        console.log("AllData",data)
        if(data.error){
          navigate('/');
          window.location.replace('/');
          return;
        }
        const allHistoriesReverse=data.histories.reverse();
        const allFriends=data.friends.reverse();
        setPlayedHistory(allHistoriesReverse || []);
        setFriendList(allFriends)
        setPlayerLevel(Math.floor((data.winNumber*400+data.lossNumber*100)/500));
        setPlayerRanking(Math.max(0, data.winNumber*2 - data.lossNumber));
      }).catch(error => {
        console.error('Error fetching player history:', error);
      });

  }, []);



  
  const handleSelect = (duration) => {
    setSelectedDuration(duration)
    matchDuration=duration;
  };

  const handleNewGame = () => {
    console.log("New Game button clicked");
    const btn=document.getElementById("new-game-btn");
    if(newBtnText==="Cancel"){
      setNewBtnText("Play Online");
      const waitingMessage = document.getElementById("waiting-message");
      if(waitingMessage){
        setWaitingMsgDisplay("none");
      // waitingMessage.style.display = 'none';
      }
      socket.emit("deleteFromWaiting");
      clearInterval(waitTimer);
    }
    else{
      socket.emit("new_game", { username: player_Name, playerLevel:0,selectedDuration:matchDuration});
      console.log("Match Duration selected:", matchDuration);
    }
  }


  const handleJoin=(req:GameRequest)=>{
    console.log("join",req)
    socket.emit("playWithFriend",{playerName:playerName,friendSocketID:req.id,friend:req.from,duration:req.duration})
  }

  const handleLater=(req:GameRequest)=>{
    console.log("Deny",req)
    socket.emit("playLater",{playerName:playerName, friendName:req.from})
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  }


  useEffect(() => {
    socket.on("active", (data) => {
      console.log("active", data)
      setFriendList(
        friendList.map((friend) =>
          friend.friendName === data ? { ...friend, active: true } : friend
        )
      );
    });
    return () => socket.off("active");
  }, [friendList]);

  useEffect(() => {
    socket.on("inActive", (data) => {
      console.log("Inactive", data)
      setFriendList(
        friendList.map((friend) =>
          friend.friendName === data ? { ...friend, active: false } : friend
        )
      );
    });
    return () => socket.off("inActive");
  }, [friendList]);

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded]);


useEffect(() => {
    socket.on("new_game_waiting_response", () => {
    const btn=document.getElementById("new-game-btn");
    const waitingMessage = document.getElementById("waiting-message");
    if(waitingMessage){
      setWaitingMsgDisplay("block");
        // waitingMessage.style.display = 'block';
    }
    setNewBtnText("Cancel");
        time=30;
        setWaitingMsg( "Waiting for an opponent to join..."+time);
        time--;
        waitTimer = setInterval(() => {
       setWaitingMsg( "Waiting for an opponent to join..."+time);
        time--;
        if(time<0){
            socket.emit("deleteFromWaiting")
            clearInterval(waitTimer);
            setNewBtnText("Play Online")
            setWaitingMsg( "No opponent found. Please try again.");
            setTimeout(() => {
                if(waitingMessage){
                  setWaitingMsgDisplay("none");
                    // waitingMessage.style.display = 'none';
                }
            }, 2000);
        }
    }, 1000);

    });

    return () => {
      socket.off("new_game_waiting_response");
    };
}, []);




useEffect(() => {
       socket.on("found_match", (data) => {
        console.log("Found match data:", data);
        clearInterval(waitTimer);
        setNewBtnText("Play Online");
        setWaitingMsgDisplay("block");
        clearInterval(timers.get(data.opponent));
        setPlayButtonText(new Map(playButtonText).set(data.opponent, "Play"));
        setDisabledUnfriend(new Map(disabledUnfriend).set(data.opponent, false));
        delete timers[data.opponent];
        localStorage.setItem("myRoomID",data.roomID);
        const waitingMessage = document.getElementById("waiting-message");
        if (waitingMessage) {
            setWaitingMsg(`Found a match! Opponent: ${data.opponent}, Room ID: ${data.roomID}`);
        }
        setTimeout(() => {
            navigate('/game',{state:{durationFromHome:data.duration,fromHome:true}});
        }, 500);
    });

    return () => {
        socket.off("found_match");
    };
}, []);



useEffect(() => {
       socket.on("game_restored_response", (data) => {

      navigate('/game',{state:{durationFromHome:data.duration,fromHome:true}});

    });

    return () => {
        socket.off("game_restored_response");
    };
}, []);



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
            console.log("Request timed out for",stillExits.from)
            socket.emit("playLater",{playerName:playerName, friendName:stillExits.from})
          }
          return prev.filter((r) => r.id !== id);
        } );
      }, 5000);
    });

    return () => {
        socket.off("requestFriendToPlay_response");
    };
}, []);

useEffect(()=>{
  socket.on("upfriend_response_me",(data)=>{
    const {index,friendName}=data;
    setFriendList(friendList.filter((friend)=>friend.friendName!==friendName))
  });

  return ()=>{
    socket.off("upfriend_response_me")
  }
},[friendList])


useEffect(()=>{
  socket.on("upfriend_response",(friendName)=>{
  setFriendList(friendList.filter((friend)=>friend.friendName!==friendName))
  });

  return ()=>{
    socket.off("upfriend_response")
  }
},[friendList])


  useEffect(() => {
    socket.on("playLater_response", (data) => {
      setPlayButtonText(new Map(playButtonText).set(data.friendName, "Play"));
      setDisabledUnfriend(new Map(disabledUnfriend).set(data.friendName, false));
      clearInterval(timers.get(data.friendName));
      delete timers[data.friendName];
    }); 

    return () => {
      socket.off("playLater_response");
    };
  }, [playButtonText, disabledUnfriend, timers]);




  return (
    <div className="home-container">
      <div className="home-left">
        <div className="player-info-home">
          <div className="player-label-home">Player Name:</div>
          <div className="player-value-home">{playerName}</div>
          <div className="player-label-home">Level:</div>
          <div className="player-value-home">{playerLevel}</div>
          <div className="player-label-home">Ranking:</div>
          <div className="player-value-home">{playerRanking}</div>
        </div>
      <button className="played-history-btn" onClick={() =>{
        if(showHistory){
          setHistoryBtn("Played History")
          setShowHistory(false)
          setshowNewGameBtn(true)
          setShowFriendList(false)

        }
        else{
          setHistoryBtn("Close Table")
          setfriendListBtn("Friend List")
          setShowFriendList(false)
          setshowNewGameBtn(false)
          setShowHistory(true)
        }
      } }>{historyBtn}</button>

      <button className="played-history-btn" onClick={() =>{
        if(showFriendList){
          setfriendListBtn("Friend List")
          setShowFriendList(false)
          setshowNewGameBtn(true)
          setShowHistory(false)
        }
        else{
          setfriendListBtn("Close Table")
          setHistoryBtn("Played History")
          setShowFriendList(true)
          setshowNewGameBtn(false)
          setShowHistory(false)
        }
      } }>{friendListBtn}</button>

    <div className="auth-buttons">
        <button className="log-out" onClick={() => {
          localStorage.removeItem('username');
          localStorage.removeItem("myRoomID")
          sessionStorage.removeItem('username');
          window.location.href = '/';
          window.location.replace('/');
        }}>Log Out</button>

    </div>
      </div>
      <div className="home-center">
        {showHistory && (
          <div className="history-table-container">
            <h2>Played History</h2>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Players</th>
                  <th>Result</th>
                  <th>Played Games</th>
                  <th>Match Duration</th>
                  <th>Played Time</th>
                </tr>
              </thead>
              <tbody>
                {playedHistory.map((row, idx) => (
                  <tr key={idx} className="row">
                    <td>
                      <div className="history-cell-flex">
                        <div className="history-cell-row-border"> 
                          {playerName}
                        </div>
                        <div className="history-cell-row">
                          {row.opponent}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="history-cell-flex">
                        <div className="history-cell-row-border"> 
                          {row.myScore}
                        </div>
                        <div className="history-cell-row">
                          {row.opponentScore}
                        </div>
                      </div>
                    </td>
                    <td>{row.totalMatch}</td>
                    <td>{row.matchDuration}</td>
                    <td>{new Date(row.playedTime).toLocaleString("en-BD",{
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) 
      }


      
      { showNewGameBtn &&
        (
          <>
            <div className="match-duration-title">Match duration</div>
            <select
              className="dropdown-menu"
              value={matchDuration}
              onChange={e => handleSelect(Number(e.target.value))}
              
            >
              {matchDurations.map((duration) => (
                <option key={duration} value={duration}>
                  {duration === 1 ? duration + " minute" : duration + " minutes"}
                </option>
              ))}
            </select>
            <button className="new-game-btn" id="new-game-btn" onClick={handleNewGame}>{newBtnText}</button>
            <h4 className="waiting-message" id="waiting-message" style={{ display: waitingMsgDisplay }}>{waitingMsg}</h4>
            <div id="activeTableContainer" className="active-table-container">
              {
                friendList.filter(friend => friend.active).map((friend)=>(
                  <div className="active-player-row" key={friend.friendName}>
                    <span className="active-player-name">{friend.friendName}</span>
                    <button
                      className="active-play-btn"
                      disabled={disabledUnfriend.get(friend.friendName) || false}
                      onClick={() => {
                        console.log("clicked", friend.friendName, playButtonText.get(friend.friendName));
                        if (!playButtonText.get(friend.friendName) || playButtonText.get(friend.friendName) === "Play") {
                          socket.emit("requestFriendToPlay", {
                            playerName: playerName,
                            friendName: friend.friendName,
                            duration: matchDuration,
                            });
                          setPlayButtonText(new Map(playButtonText).set(friend.friendName, "Waiting..."));
                          setDisabledUnfriend(new Map(disabledUnfriend).set(friend.friendName, true));
                          const timer=setTimeout(() => {
                            setPlayButtonText(new Map(playButtonText).set(friend.friendName, "Play"));
                            setDisabledUnfriend(new Map(disabledUnfriend).set(friend.friendName, false));
                            delete timers[friend.friendName];
                            console.log("setTimeout called",timer)
                          }, 10000);
                          setTimers(new Map(timers).set(friend.friendName,timer))
                        }

                      }}
                    >
                      {playButtonText.get(friend.friendName) || "Play"}
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}


        {
          showFriendList && 
          (
          <div className="history-table-container">
            <h2>Friend List</h2>
            <table className="history-table" id="friendListTable">
              <thead>
                <tr>
                  <th>Friends</th>
                  <th>Wins</th>
                  <th>losses</th>
                  <th>Level</th>
                  <th>Rank</th>
                  <th>Unfriend</th>
                </tr>
              </thead>
              <tbody>
                {friendList.map((row, idx) => (
                  <tr key={idx} className="row">
                    <td>
                      {row.friendName}
                    </td>
                    <td>
                      {row.friendWinNumber}
                    </td>
                    <td>{row.friendLossNumber}</td>
                    <td>{Math.floor((row.friendWinNumber*400+row.friendLossNumber*100)/500)}</td>
                    <td>{Math.max(0, row.friendWinNumber*2 - row.friendLossNumber)}</td>
                    <td>
                      <button onClick={()=>{
                        console.log("Unfriend",row.friendName)
                        socket.emit("unfriend",{playerName:playerName,friendName:row.friendName,index:idx})
                        
                      }}
                      
                      
                      >Unfriend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        }
      </div>
        <div className="notifications">
          {requests.map((req) => (
            <div key={req.id} className="notification">
              <p><b>{req.from}</b>{req.msg} </p>
              <div className="actions">
                <button style={ {display:req.btn ? "block" : "none"}} id="join" className="join" onClick={() => handleJoin(req)}>Join</button>
                <button style={ {display: req.btn ? "block" : "none"}} id="deny" className="deny" onClick={() => handleLater(req)}>Later</button>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default Home; 