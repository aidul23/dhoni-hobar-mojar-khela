import { ChartColumn, Check, Landmark, LogOut, Plus, RotateCcw, Save, ScrollText, type LucideIcon } from 'lucide-react';
import { useT } from '../../store/gameStore';

interface Props {
  online: boolean;
  onLeave: () => void;
  savedFlash: boolean;
  onSave: () => void;
  onStats: () => void;
  onRules: () => void;
  onBank: () => void;
  onReset: () => void;
  onNew: () => void;
}

function ToolButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded-lg bg-white px-1 py-1.5 text-xs font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50 active:scale-95"
    >
      <Icon className="h-[18px] w-[18px] text-emerald-800" strokeWidth={2.2} aria-hidden />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

export function GameToolbar({ online, onLeave, savedFlash, onSave, onStats, onRules, onBank, onReset, onNew }: Props) {
  const t = useT();
  if (online) {
    // Online: no local save/reset; leaving the room replaces "new game".
    return (
      <div className="grid grid-cols-4 gap-1.5">
        <ToolButton icon={ChartColumn} label={t('stats')} onClick={onStats} />
        <ToolButton icon={Landmark} label={t('bankLabel')} onClick={onBank} />
        <ToolButton icon={ScrollText} label={t('rules')} onClick={onRules} />
        <ToolButton icon={LogOut} label={t('leaveRoom')} onClick={onLeave} />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-3">
      <ToolButton icon={savedFlash ? Check : Save} label={savedFlash ? t('saved') : t('saveGame')} onClick={onSave} />
      <ToolButton icon={ChartColumn} label={t('stats')} onClick={onStats} />
      <ToolButton icon={Landmark} label={t('bankLabel')} onClick={onBank} />
      <ToolButton icon={ScrollText} label={t('rules')} onClick={onRules} />
      <ToolButton icon={RotateCcw} label={t('resetGame')} onClick={onReset} />
      <ToolButton icon={Plus} label={t('newGame')} onClick={onNew} />
    </div>
  );
}
