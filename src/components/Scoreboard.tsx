import { useState, useEffect, useRef, useCallback } from 'react';
import { GameFormat } from '@/types/game';
import { Play, Pause, RotateCcw, SkipForward, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const intervalRef = useRef<number | null>(null);

  const playAlarm = useCallback(() => {
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
  }, []);

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
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      {/* Back button */}
      <div className="mb-4 w-full max-w-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="mb-4 w-full max-w-lg rounded-xl bg-card py-4 text-center">
        <h1 className="flex items-center justify-center gap-3 text-2xl font-bold text-foreground">
          <img src={soccerBallIcon} alt="Soccer Ball" className="h-8 w-8 brightness-0 invert" />
          Scoreboard APP
        </h1>
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
            onClick={() => setIsRunning(!isRunning)}
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

      {/* Score Section - Combined Card */}
      <div className="mb-4 w-full max-w-lg rounded-xl border-2 border-score-home bg-card p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value.toUpperCase())}
              className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground outline-none focus:text-foreground"
              maxLength={12}
            />
            <div className="mb-3 text-center font-score text-7xl text-score-home">
              {homeScore}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => adjustScore('home', -1)}
                className="h-10 w-14 border-muted-foreground/30 text-lg font-bold"
              >
                −
              </Button>
              <Button
                onClick={() => adjustScore('home', 1)}
                className="h-10 w-14 bg-score-home text-lg font-bold text-white hover:bg-score-home/80"
              >
                +
              </Button>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={awayName}
              onChange={(e) => setAwayName(e.target.value.toUpperCase())}
              className="mb-2 w-full bg-transparent text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground outline-none focus:text-foreground"
              maxLength={12}
            />
            <div className="mb-3 text-center font-score text-7xl text-score-away">
              {awayScore}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => adjustScore('away', -1)}
                className="h-10 w-14 border-muted-foreground/30 text-lg font-bold"
              >
                −
              </Button>
              <Button
                onClick={() => adjustScore('away', 1)}
                className="h-10 w-14 bg-score-away text-lg font-bold text-white hover:bg-score-away/80"
              >
                +
              </Button>
            </div>
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
