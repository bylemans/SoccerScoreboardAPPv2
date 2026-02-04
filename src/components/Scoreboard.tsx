import { useState, useEffect, useRef, useCallback } from 'react';
import { GameFormat } from '@/types/game';
import { Play, Pause, RotateCcw, ChevronRight, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScoreboardProps {
  format: GameFormat;
  onBack: () => void;
}

const Scoreboard = ({ format, onBack }: ScoreboardProps) => {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeName, setHomeName] = useState('HOME');
  const [awayName, setAwayName] = useState('AWAY');
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(format.periodDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isTimerEnded, setIsTimerEnded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const playAlarm = useCallback(() => {
    if (!isAudioEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [isAudioEnabled]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsTimerEnded(true);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
      const labels = ['1st', '2nd', '3rd', '4th'];
      return `${labels[currentPeriod - 1] || currentPeriod} Quarter`;
    }
    if (format.periodName === 'half') {
      return currentPeriod === 1 ? '1st Half' : '2nd Half';
    }
    return `Period ${currentPeriod}`;
  };

  const handleNextPeriod = () => {
    if (currentPeriod < format.periodCount) {
      setCurrentPeriod((prev) => prev + 1);
      setTimeRemaining(format.periodDuration * 60);
      setIsRunning(false);
      setIsTimerEnded(false);
    }
  };

  const handleReset = () => {
    setCurrentPeriod(1);
    setTimeRemaining(format.periodDuration * 60);
    setHomeScore(0);
    setAwayScore(0);
    setIsRunning(false);
    setIsTimerEnded(false);
  };

  const adjustScore = (team: 'home' | 'away', delta: number) => {
    if (team === 'home') {
      setHomeScore((prev) => Math.max(0, prev + delta));
    } else {
      setAwayScore((prev) => Math.max(0, prev + delta));
    }
  };

  const isGameOver = currentPeriod === format.periodCount && timeRemaining === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Period Indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="rounded-full bg-primary/20 px-4 py-2 text-sm font-semibold text-primary">
          {format.ageGroup} {format.format}
        </span>
        <span className="rounded-full bg-accent/20 px-4 py-2 text-sm font-semibold text-accent">
          {getPeriodLabel()}
        </span>
      </div>

      {/* Period Progress */}
      <div className="mb-8 flex justify-center gap-2">
        {Array.from({ length: format.periodCount }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-8 rounded-full transition-colors ${
              i < currentPeriod
                ? 'bg-primary'
                : i === currentPeriod - 1
                ? 'bg-primary animate-pulse'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="mb-8 flex flex-col items-center">
        <div
          className={`rounded-2xl border-4 px-8 py-4 transition-all ${
            isTimerEnded
              ? 'animate-timer-flash border-destructive bg-destructive/20'
              : isRunning
              ? 'animate-pulse-glow border-primary bg-primary/10'
              : 'border-border bg-card'
          }`}
        >
          <span className="font-score text-6xl tracking-wider text-foreground sm:text-7xl">
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="mb-8 flex justify-center gap-4">
        <Button
          size="lg"
          variant={isRunning ? 'secondary' : 'default'}
          onClick={() => setIsRunning(!isRunning)}
          disabled={timeRemaining === 0}
          className="gap-2 px-8"
        >
          {isRunning ? (
            <>
              <Pause className="h-5 w-5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5" /> Start
            </>
          )}
        </Button>
      </div>

      {/* Scores */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {/* Home Team */}
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-4">
          <input
            type="text"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value.toUpperCase())}
            className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wide text-score-home outline-none focus:underline"
            maxLength={12}
          />
          <div className="mb-4 font-score text-5xl text-foreground sm:text-6xl">
            {homeScore}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustScore('home', -1)}
              className="h-12 w-12 text-lg font-bold"
            >
              −
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={() => adjustScore('home', 1)}
              className="h-12 w-12 text-lg font-bold"
            >
              +
            </Button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-4">
          <input
            type="text"
            value={awayName}
            onChange={(e) => setAwayName(e.target.value.toUpperCase())}
            className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wide text-score-away outline-none focus:underline"
            maxLength={12}
          />
          <div className="mb-4 font-score text-5xl text-foreground sm:text-6xl">
            {awayScore}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustScore('away', -1)}
              className="h-12 w-12 text-lg font-bold"
            >
              −
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={() => adjustScore('away', 1)}
              className="h-12 w-12 text-lg font-bold"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Game
        </Button>
        {!isGameOver && (
          <Button
            variant="secondary"
            onClick={handleNextPeriod}
            disabled={currentPeriod >= format.periodCount}
            className="gap-2"
          >
            Next {format.periodName === 'half' ? 'Half' : format.periodName === 'quarter' ? 'Quarter' : 'Period'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Game Over Message */}
      {isGameOver && (
        <div className="mt-6 text-center">
          <span className="inline-block rounded-full bg-accent/20 px-6 py-3 text-lg font-bold text-accent">
            🎉 Game Complete!
          </span>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
