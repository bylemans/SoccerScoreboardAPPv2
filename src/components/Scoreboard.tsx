import { useState, useEffect, useRef, useCallback } from 'react';
import { GameFormat } from '@/types/game';
import { Play, Pause, RotateCcw, SkipForward, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScoreboardProps {
  format: GameFormat;
  onBack: () => void;
}

interface PeriodScore {
  home: number;
  away: number;
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
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>(
    Array.from({ length: format.periodCount }, () => ({ home: 0, away: 0 }))
  );
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
    setPeriodScores(Array.from({ length: format.periodCount }, () => ({ home: 0, away: 0 })));
  };

  const adjustScore = (team: 'home' | 'away', delta: number) => {
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
      {/* Back and Audio buttons */}
      <div className="mb-4 flex w-full max-w-lg items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
      </div>

      {/* Header */}
      <div className="mb-4 w-full max-w-lg rounded-xl bg-primary py-4 text-center">
        <h1 className="flex items-center justify-center gap-3 text-2xl font-bold text-primary-foreground">
          <span className="text-3xl">⚽</span>
          Scoreboard
          <span className="ml-2 text-base font-normal opacity-80">
            {format.ageGroup} {format.format}
          </span>
        </h1>
      </div>

      {/* Timer Section */}
      <div className="mb-4 w-full max-w-lg rounded-xl bg-card p-6">
        <p className="mb-2 text-center text-sm text-muted-foreground">
          {getPeriodLabel()}
        </p>
        <div
          className={`mb-4 text-center font-score text-7xl tracking-wider text-foreground ${
            isTimerEnded ? 'animate-timer-flash' : ''
          }`}
        >
          {formatTime(timeRemaining)}
        </div>
        
        {/* Timer Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsRunning(!isRunning)}
            disabled={timeRemaining === 0}
            className="gap-2 border-primary/50 hover:bg-primary/20"
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
            variant="default"
            onClick={handleNextPeriod}
            disabled={currentPeriod >= format.periodCount}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <SkipForward className="h-4 w-4" /> Next
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Score Section */}
      <div className="mb-4 grid w-full max-w-lg grid-cols-2 gap-3">
        {/* Home Team */}
        <div className="rounded-xl border-2 border-score-home/50 bg-card p-4">
          <input
            type="text"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value.toUpperCase())}
            className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground outline-none focus:text-foreground"
            maxLength={12}
          />
          <div className="mb-4 text-center font-score text-6xl text-score-home">
            {homeScore}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => adjustScore('home', -1)}
              className="flex-1 border-border text-lg font-bold hover:bg-secondary"
            >
              −
            </Button>
            <Button
              onClick={() => adjustScore('home', 1)}
              className="flex-1 bg-score-home text-lg font-bold text-white hover:bg-score-home/80"
            >
              +
            </Button>
          </div>
        </div>

        {/* Away Team */}
        <div className="rounded-xl border-2 border-score-away/50 bg-card p-4">
          <input
            type="text"
            value={awayName}
            onChange={(e) => setAwayName(e.target.value.toUpperCase())}
            className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground outline-none focus:text-foreground"
            maxLength={12}
          />
          <div className="mb-4 text-center font-score text-6xl text-score-away">
            {awayScore}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => adjustScore('away', -1)}
              className="flex-1 border-border text-lg font-bold hover:bg-secondary"
            >
              −
            </Button>
            <Button
              onClick={() => adjustScore('away', 1)}
              className="flex-1 bg-score-away text-lg font-bold text-white hover:bg-score-away/80"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
      <div className="w-full max-w-lg rounded-xl bg-card p-4">
        <h3 className="mb-4 text-center text-sm font-semibold text-muted-foreground">
          {format.periodName === 'quarter' ? 'Quarter' : format.periodName === 'half' ? 'Half' : 'Period'} Breakdown
        </h3>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(format.periodCount, 6)}, 1fr)` }}>
          {periodScores.map((score, index) => (
            <div
              key={index}
              className={`rounded-lg border p-3 text-center transition-colors ${
                index === currentPeriod - 1
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/50'
              }`}
            >
              <div className="mb-1 text-xs font-semibold text-muted-foreground">
                {getShortPeriodLabel(index)}
              </div>
              <div className="text-sm font-bold text-score-home">{score.home}</div>
              <div className="text-sm font-bold text-score-away">{score.away}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
