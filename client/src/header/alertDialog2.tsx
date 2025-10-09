import React, { useEffect, useState } from "react";
import '../css/alertDialog.css';

type AlertDialogProps = {
  onLeave2: () => void;
  onTimeout2: () => void;
};

const AlertDialog2: React.FC<AlertDialogProps> = ({  onLeave2, onTimeout2 }) => {
  const [timeLeft, setTimeLeft] = useState(20);

  console.log("AlertDialog2 is called")

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout2();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeout2]);

  return (

    <div className="alertDialogOverlay">
      <div >
        <h2>Opponent lost connection</h2>
        <p >Response in {timeLeft} seconds</p>
        <div >
          <button
            
            onClick={onLeave2} 
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog2;
