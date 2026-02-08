import { useState, useEffect, useRef, useCallback } from 'react';
import { GameFormat } from '@/types/game';
import { Play, Pause, RotateCcw, SkipForward, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVibrate } from '@/hooks/useVibrate';
import soccerBallIcon from '@/assets/soccer-ball-icon.png';

interface ScoreboardProps {
  format: GameFormat;
  onBack: () => void;
}

interface PeriodScore {
  home: number;
  away: number;
}

const Scoreboard = ({ format, onBack }: ScoreboardProps) => {
  const { vibrate } = useVibrate();
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeName, setHomeName] = useState('HOME');
  const [awayName, setAwayName] = useState('AWAY');
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(format.periodDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimerEnded, setIsTimerEnded] = useState(false);
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>(
    Array.from({ length: format.periodCount }, () => ({ home: 0, away: 0 }))
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playAlarm = useCallback(() => {
    // Strong vibration pattern - long pulses for better notice
    const strongVibration = [500, 200, 500, 200, 500, 200, 500, 200, 500];
    vibrate(strongVibration);

    // Show notification with vibrate (Android can vibrate in background via notification)
    if ('Notification' in window && Notification.permission === 'granted') {
      const periodLabel = format.periodName === 'quarter' 
        ? `Quarter ${currentPeriod}` 
        : format.periodName === 'half' 
          ? `Half ${currentPeriod}` 
          : `Period ${currentPeriod}`;
      
      // Use ServiceWorker registration for better background support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('⏱️ Period Ended!', {
            body: `${periodLabel} has ended`,
            icon: '/app-icon.png',
            tag: 'timer-alarm',
            requireInteraction: true,
            vibrate: strongVibration,
          } as NotificationOptions);
        });
      } else {
        // Fallback to regular notification
        const notification = new Notification('⏱️ Period Ended!', {
          body: `${periodLabel} has ended`,
          icon: '/app-icon.png',
          tag: 'timer-alarm',
          requireInteraction: true,
        });
        setTimeout(() => notification.close(), 10000);
      }
    }

    // Also try to play audio (works when app is active)
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (common after background)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Play three beeps for better audibility
      for (let i = 0; i < 3; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + i * 0.4);
        
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.4 + 0.3);
        
        oscillator.start(ctx.currentTime + i * 0.4);
        oscillator.stop(ctx.currentTime + i * 0.4 + 0.3);
      }
    } catch (e) {
      console.log('Audio not available');
    }
  }, [vibrate, format.periodName, currentPeriod]);

  // Time-based timer that works even when app is in background
  useEffect(() => {
    if (!isRunning) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Set the end time when starting
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeRemaining * 1000;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current! - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setIsRunning(false);
        setIsTimerEnded(true);
        endTimeRef.current = null;
        playAlarm();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);

    // Also use visibility change to update immediately when returning to app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && endTimeRef.current) {
        updateTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, playAlarm]);

  useEffect(() => {
    if (isTimerEnded) {
      const timeout = setTimeout(() => setIsTimerEnded(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isTimerEnded]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPeriodLabel = () => {
    if (format.periodName === 'quarter') {
      return `Quarter ${currentPeriod} / ${format.periodCount}`;
    }
    if (format.periodName === 'half') {
      return `Half ${currentPeriod} / ${format.periodCount}`;
    }
    return `Period ${currentPeriod} / ${format.periodCount}`;
  };

  const getShortPeriodLabel = (index: number) => {
    if (format.periodName === 'quarter') return `Q${index + 1}`;
    if (format.periodName === 'half') return `H${index + 1}`;
    return `P${index + 1}`;
  };

  const handleNextPeriod = () => {
    vibrate(15);
    if (currentPeriod < format.periodCount) {
      setCurrentPeriod((prev) => prev + 1);
      setTimeRemaining(format.periodDuration * 60);
      setIsRunning(false);
      setIsTimerEnded(false);
      endTimeRef.current = null;
    }
  };

  const handleReset = () => {
    vibrate([15, 50, 15]);
    setCurrentPeriod(1);
    setTimeRemaining(format.periodDuration * 60);
    setHomeScore(0);
    setAwayScore(0);
    setIsRunning(false);
    setIsTimerEnded(false);
    endTimeRef.current = null;
    setPeriodScores(Array.from({ length: format.periodCount }, () => ({ home: 0, away: 0 })));
  };

  const adjustScore = (team: 'home' | 'away', delta: number) => {
    vibrate(10);
    const periodIndex = currentPeriod - 1;
    
    if (team === 'home') {
      const newPeriodScore = Math.max(0, periodScores[periodIndex].home + delta);
      const scoreDiff = newPeriodScore - periodScores[periodIndex].home;
      
      setPeriodScores((prev) => {
        const updated = [...prev];
        updated[periodIndex] = { ...updated[periodIndex], home: newPeriodScore };
        return updated;
      });
      setHomeScore((prev) => Math.max(0, prev + scoreDiff));
    } else {
      const newPeriodScore = Math.max(0, periodScores[periodIndex].away + delta);
      const scoreDiff = newPeriodScore - periodScores[periodIndex].away;
      
      setPeriodScores((prev) => {
        const updated = [...prev];
        updated[periodIndex] = { ...updated[periodIndex], away: newPeriodScore };
        return updated;
      });
      setAwayScore((prev) => Math.max(0, prev + scoreDiff));
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-6">
      {/* Header with back button and format display */}
      <div className="mb-4 w-full max-w-lg">
        <div className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <img src={soccerBallIcon} alt="Soccer Ball" className="h-6 w-6 brightness-0 invert" />
            Scoreboard
          </h1>
          <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-bold text-primary">
            {format.ageGroup} {format.format}
          </span>
        </div>
      </div>

      {/* Timer Section */}
      <div className="mb-4 w-full max-w-lg rounded-xl bg-card p-6">
        <p className="mb-2 text-center text-base text-muted-foreground">
          {getPeriodLabel()}
        </p>
        <div
          className={`mb-4 text-center font-score text-6xl tracking-wider text-foreground ${
            isTimerEnded ? 'animate-timer-flash' : ''
          }`}
        >
          {formatTime(timeRemaining)}
        </div>
        
        {/* Timer Controls */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={() => {
              vibrate(15);
              if (isRunning) {
                // Pausing: save remaining time and clear end time
                endTimeRef.current = null;
              } else {
                // Starting: set new end time based on remaining time
                endTimeRef.current = Date.now() + timeRemaining * 1000;
              }
              setIsRunning(!isRunning);
            }}
            disabled={timeRemaining === 0}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/80"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Play
              </>
            )}
          </Button>
          <Button
            onClick={handleNextPeriod}
            disabled={currentPeriod >= format.periodCount}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/80"
          >
            <SkipForward className="h-4 w-4" /> Next
          </Button>
          <Button
            onClick={handleReset}
            className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/80"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Score Section - Two Separate Cards */}
      <div className="mb-4 grid w-full max-w-lg grid-cols-2 gap-3">
        {/* Home Team */}
        <div className="flex flex-col items-center rounded-xl border-2 border-score-home bg-card p-4">
          <input
            type="text"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value.toUpperCase())}
            className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground outline-none focus:text-foreground"
            maxLength={12}
          />
          <div className="mb-3 text-center font-score text-6xl text-score-home">
            {homeScore}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => adjustScore('home', -1)}
              className="h-10 w-12 border-muted-foreground/30 text-lg font-bold"
            >
              −
            </Button>
            <Button
              onClick={() => adjustScore('home', 1)}
              className="h-10 w-12 bg-score-home text-lg font-bold text-white hover:bg-score-home/80"
            >
              +
            </Button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center rounded-xl border-2 border-score-away bg-card p-4">
          <input
            type="text"
            value={awayName}
            onChange={(e) => setAwayName(e.target.value.toUpperCase())}
            className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground outline-none focus:text-foreground"
            maxLength={12}
          />
          <div className="mb-3 text-center font-score text-6xl text-score-away">
            {awayScore}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => adjustScore('away', -1)}
              className="h-10 w-12 border-muted-foreground/30 text-lg font-bold"
            >
              −
            </Button>
            <Button
              onClick={() => adjustScore('away', 1)}
              className="h-10 w-12 bg-score-away text-lg font-bold text-white hover:bg-score-away/80"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
      <div className="w-full max-w-lg rounded-xl bg-card p-4">
        <h3 className="mb-3 text-center text-base font-semibold text-foreground">
          {format.periodName === 'quarter' ? 'Quarter' : format.periodName === 'half' ? 'Half' : 'Period'} Breakdown
        </h3>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${format.periodCount}, 1fr)` }}>
          {periodScores.map((score, index) => (
            <div
              key={index}
              className={`rounded-lg border p-3 text-center transition-colors ${
                index === currentPeriod - 1
                  ? 'border-2 border-primary bg-primary/10'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="mb-1 text-xs font-bold text-muted-foreground">
                {getShortPeriodLabel(index)}
              </div>
              <div className="text-sm font-medium text-score-home">{score.home}</div>
              <div className="text-sm font-medium text-score-away">{score.away}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
