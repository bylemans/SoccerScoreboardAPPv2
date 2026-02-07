import { useState, useEffect } from 'react';
import { GameFormat, GAME_FORMATS } from '@/types/game';
import GameFormatCard from '@/components/GameFormatCard';
import Scoreboard from '@/components/Scoreboard';
import soccerBallIcon from '@/assets/soccer-ball-icon.png';

const Index = () => {
  const [selectedFormat, setSelectedFormat] = useState<GameFormat | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <img
          src={soccerBallIcon}
          alt="Soccer Ball"
          className="mb-6 h-32 w-32 animate-bounce brightness-0 invert"
        />
        <h1 className="text-4xl font-bold text-foreground">Scoreboard APP</h1>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (selectedFormat) {
    return <Scoreboard format={selectedFormat} onBack={() => setSelectedFormat(null)} />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 flex items-center justify-center gap-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <img src={soccerBallIcon} alt="Soccer Ball" className="h-8 w-8 brightness-0 invert sm:h-10 sm:w-10" />
            Soccer Scoreboard
          </h1>
          <p className="text-muted-foreground">
            Select your game format to start
          </p>
        </div>

        {/* Format Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {GAME_FORMATS.map((format) => (
            <GameFormatCard
              key={format.id}
              format={format}
              onClick={() => setSelectedFormat(format)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
