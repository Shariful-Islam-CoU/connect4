
interface Room{
    roomID:string,
    player1_socketID:string,
    player2_socketID:string,
    player1_name:string,
    player2_name:string,
    player1_score:number,
    player2_score:number,
    board: number[][],
    active_status: boolean,
    player1_turn:boolean,
    player2_turn:boolean,
    player1_time:number,
    player2_time:number,
    start_time: Date,
    current_turn_start_time: Date,
    duration: number,
    drawNumber:number

}

export default Room;