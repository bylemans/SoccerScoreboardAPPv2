import { GameFormat } from '@/types/game';
import { getRulesForFormat } from '@/data/gameRules';
import GameRulesDialog from '@/components/GameRulesDialog';
import { Users, Clock, Layers } from 'lucide-react';

interface GameFormatCardProps {
  format: GameFormat;
  onClick: () => void;
}

const GameFormatCard = ({ format, onClick }: GameFormatCardProps) => {
  const rules = getRulesForFormat(format.format);
  
  const getPeriodLabel = (count: number, name: string) => {
    if (name === 'period') return `${count} periods`;
    if (name === 'quarter') return `${count} quarters`;
    return `${count} halves`;
  };

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-lg border border-border bg-card p-3 text-left transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative z-10">
        {/* Age Group and Format on same row */}
        <div className="mb-2 flex items-center justify-between">
          <div className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1">
            <span className="text-base font-bold text-primary">{format.ageGroup}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="text-sm font-medium">{format.format}</span>
          </div>
        </div>

        {/* Details in compact row */}
        <div className="flex items-center justify-between text-xs text-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3 text-accent" />
              <span>{getPeriodLabel(format.periodCount, format.periodName)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-accent" />
              <span>{format.periodDuration} min</span>
            </div>
          </div>
          {rules && (
            <GameRulesDialog rules={rules} formatLabel={`${format.ageGroup} ${format.format}`} />
          )}
        </div>
      </div>
    </button>
  );
};

export default GameFormatCard;
