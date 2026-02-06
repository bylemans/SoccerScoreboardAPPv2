import { GameRules } from '@/data/gameRules';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

interface GameRulesDialogProps {
  rules: GameRules;
  formatLabel: string;
}

const GameRulesDialog = ({ rules, formatLabel }: GameRulesDialogProps) => {
  const ruleItems = [
    { label: 'Speeltijd', value: rules.playTime },
    { label: 'Terrein', value: rules.field },
    { label: 'Doelen', value: rules.goals },
    { label: 'Bal', value: rules.ball },
    { label: 'Rangschikking', value: rules.ranking },
    { label: 'Vervangingen', value: rules.substitutions },
    { label: 'Buitenspel', value: rules.offside },
    { label: 'Strafschop', value: rules.penalty },
    { label: 'Doeltrap', value: rules.goalKick },
    { label: 'Vrije trap', value: rules.freeKick },
    { label: 'Hoekschop', value: rules.cornerKick },
    { label: 'Zijlijn', value: rules.throwIn },
    { label: 'Kaarten', value: rules.cards },
    { label: 'Fairplay', value: rules.fairplay },
    { label: 'Schoeisel', value: rules.shoes },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-primary/50 text-primary hover:bg-primary/10"
          onClick={(e) => e.stopPropagation()}
        >
          <BookOpen className="h-3 w-3" />
          Regels
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            Spelregels {formatLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          {ruleItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {item.label}
              </span>
              <span className="text-right text-sm text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Bron: Voetbal Vlaanderen Jeugdreglementering
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameRulesDialog;
