import { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: 'blue' | 'teal' | 'green' | 'amber' | 'purple';
  subtitle?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const colorClasses = {
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
};

const activeRingClasses = {
  blue: 'ring-blue-500',
  teal: 'ring-teal-500',
  green: 'ring-green-500',
  amber: 'ring-amber-500',
  purple: 'ring-purple-500',
};

export function StatsCard({ title, value, icon, color, subtitle, onClick, isActive }: StatsCardProps) {
  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]' : ''} ${isActive ? `ring-2 ${activeRingClasses[color]} shadow-md` : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${colorClasses[color]} bg-opacity-10`}>
              <div className={`text-white p-2 rounded-full ${colorClasses[color]}`}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold">{value}</h3>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {onClick && (
            <div className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
              {isActive ? '✓ Active' : 'Click to filter'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
