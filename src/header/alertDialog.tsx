import React, { useEffect, useState } from "react";
import '../css/alertDialog.css';

type AlertDialogProps = {
  onYes: () => void;
  onLeave: () => void;
  onTimeout: () => void;
};

const AlertDialog: React.FC<AlertDialogProps> = ({ onYes, onLeave, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [btn,setBtn]=useState("Yes");

  console.log("AlertDialog is called")

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeout]);

  return (

    <div className="alertDialogOverlay">
      <div >
        <h2>Play again?</h2>
        <p >Response in {timeLeft} seconds</p>
        <div >
          <button
            disabled={btn === "Waiting..."}
            onClick={() => {
              setBtn("Waiting...");              
              onYes();
            }}
          >
            {btn}
          </button>
          <button
            
            onClick={onLeave} 
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
