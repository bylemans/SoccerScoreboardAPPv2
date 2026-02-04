import { GameFormat } from '@/types/game';
import { Users, Clock, Layers } from 'lucide-react';

interface GameFormatCardProps {
  format: GameFormat;
  onClick: () => void;
}

const GameFormatCard = ({ format, onClick }: GameFormatCardProps) => {
  const getPeriodLabel = (count: number, name: string) => {
    if (name === 'period') return `${count} periods`;
    if (name === 'quarter') return `${count} quarters`;
    return `${count} halves`;
  };

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative z-10">
        {/* Age Group Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2">
          <span className="text-xl font-bold text-primary">{format.ageGroup}</span>
        </div>

        {/* Format */}
        <div className="mb-4 flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{format.format}</span>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <Layers className="h-4 w-4 text-accent" />
            <span className="text-sm">{getPeriodLabel(format.periodCount, format.periodName)}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm">{format.periodDuration} min each</span>
          </div>
        </div>

        {/* Total time */}
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">Total: </span>
          <span className="text-sm font-semibold text-foreground">
            {format.periodCount * format.periodDuration} minutes
          </span>
        </div>
      </div>
    </button>
  );
};

export default GameFormatCard;
