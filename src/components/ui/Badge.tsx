import type { BadgeVariant } from '../../types';

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  icon?: string;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  injury:    'bg-red-500/10 text-red-400 border border-red-500/20',
  dome:      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  weather:   'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  position:  'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  highlight: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  contract:  'bg-green-500/10 text-green-400 border border-green-500/20',
  fantasy:   'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  afc:       'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  nfc:       'bg-red-500/10 text-red-400 border border-red-500/20',
  success:   'bg-green-500/10 text-green-400 border border-green-500/20',
  warning:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  danger:    'bg-red-600/10 text-red-500 border border-red-600/20',
  info:      'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  default:   'bg-gray-700/50 text-gray-300 border border-gray-600/30',
};

export function Badge({ variant, label, icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
