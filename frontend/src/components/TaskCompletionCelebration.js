import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';

const TaskCompletionCelebration = ({ task, onClose }) => {
  const [animationType, setAnimationType] = useState('');
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Early return if task is null
    if (!task) {
      onClose && onClose();
      return;
    }

    // Safely get the deadline
    const getDeadline = () => {
      if (task.reworkDetails && task.reworkDetails.length > 0) {
        return new Date(task.reworkDetails[task.reworkDetails.length - 1].deadline);
      }
      return task.dueDate ? new Date(task.dueDate) : new Date();
    };

    const now = new Date();
    const deadline = getDeadline();

    // Determine celebration type
    if (task.status === 'Rework') {
      setAnimationType('rework-complete');
      playReworkCompleteSound();
    } else if (deadline < now && task.status !== 'Completed') {
      setAnimationType('overdue-complete');
      playOverdueSound();
    } else {
      setAnimationType('on-time-complete');
      playOnTimeSound();
    }

    // Cleanup function
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [task, onClose]);

  const playOnTimeSound = () => {
    const synth = new Tone.PolySynth().toDestination();
    const now = Tone.now();
    
    // Cheerful, ascending melody
    synth.triggerAttackRelease('C4', '8n', now);
    synth.triggerAttackRelease('E4', '8n', now + 0.5);
    synth.triggerAttackRelease('G4', '8n', now + 1);
    synth.triggerAttackRelease('C5', '4n', now + 1.5);
  };

  const playOverdueSound = () => {
    const synth = new Tone.PolySynth().toDestination();
    const now = Tone.now();
    
    // More somber, descending melody
    synth.triggerAttackRelease('C5', '8n', now, 0.5);
    synth.triggerAttackRelease('A4', '8n', now + 0.5, 0.5);
    synth.triggerAttackRelease('F4', '8n', now + 1, 0.5);
    synth.triggerAttackRelease('D4', '4n', now + 1.5, 0.5);
  };

  const playReworkCompleteSound = () => {
    const synth = new Tone.PolySynth().toDestination();
    const now = Tone.now();
    
    // Neutral, balanced melody
    synth.triggerAttackRelease('G4', '8n', now);
    synth.triggerAttackRelease('C5', '8n', now + 0.5);
    synth.triggerAttackRelease('E4', '8n', now + 1);
    synth.triggerAttackRelease('B4', '4n', now + 1.5);
  };

  // If no task or no animation type, return null
  if (!task || !animationType) {
    return null;
  }

  return (
    <div className={`task-completion-celebration ${animationType}`}>
      {animationType === 'on-time-complete' && (
        <div className="confetti-container">
          {[...Array(50)].map((_, index) => (
            <div 
              key={index} 
              className="confetti-piece" 
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
              }}
            />
          ))}
          <div className="celebration-message">
            <h2>Task Completed On Time!</h2>
            <p>Great job staying ahead of schedule!</p>
          </div>
        </div>
      )}

      {animationType === 'overdue-complete' && (
        <div className="overdue-container">
          <div className="warning-animation">
            <svg viewBox="0 0 100 100" className="warning-icon">
              <path d="M50 10 L10 90 L90 90 Z" fill="#ff6b6b" />
              <text x="50" y="70" textAnchor="middle" fill="white" fontSize="30">!</text>
            </svg>
          </div>
          <div className="celebration-message">
            <h2>Task Completed (Overdue)</h2>
            <p>You finished it! Try to complete tasks earlier next time.</p>
          </div>
        </div>
      )}

      {animationType === 'rework-complete' && (
        <div className="rework-container">
          <div className="rework-animation">
            <svg viewBox="0 0 100 100" className="rework-icon">
              <circle cx="50" cy="50" r="40" fill="#4ecdc4" />
              <path d="M35 50 L45 60 L65 40" stroke="white" strokeWidth="6" fill="none" />
            </svg>
          </div>
          <div className="celebration-message">
            <h2>Rework Task Completed</h2>
            <p>Nice work resolving the previous challenges!</p>
          </div>
        </div>
      )}
<style jsx>{`
.task-completion-celebration {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.5);
display: flex;
justify-content: center;
align-items: center;
z-index: 1000;
overflow: hidden;
}

.confetti-container {
position: relative;
width: 100%;
height: 100%;
display: flex;
justify-content: center;
align-items: center;
flex-direction: column;
}

.confetti-piece {
position: absolute;
width: 10px;
height: 10px;
transform: rotate(45deg);
animation: fall 3s linear infinite;
}

@keyframes fall {
0% {
transform: translateY(-100vh) rotate(45deg);
}
100% {
transform: translateY(100vh) rotate(720deg);
}
}

.celebration-message {
text-align: center;
color: white;
z-index: 10;
background: rgba(0, 0, 0, 0.7);
padding: 20px;
border-radius: 10px;
}

.overdue-container, .rework-container {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
}

.warning-animation .warning-icon {
width: 200px;
animation: pulse 1s infinite alternate;
}

.rework-animation .rework-icon {
width: 200px;
animation: bounce 1s infinite alternate;
}

@keyframes pulse {
0% { transform: scale(1); }
100% { transform: scale(1.1); }
}

@keyframes bounce {
0% { transform: translateY(0); }
100% { transform: translateY(-20px); }
}

`}</style>
    </div>
  );
};

export default TaskCompletionCelebration;


    