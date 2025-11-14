import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, iconColor = "bg-primary" }: StatCardProps) {
  return (
    <Card 
      className="relative overflow-hidden transition-all hover:shadow-md" 
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`${iconColor} rounded-xl p-3 flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColor.includes('blue') ? 'text-blue-600' : 
              iconColor.includes('green') ? 'text-green-600' : 
              iconColor.includes('purple') ? 'text-purple-600' : 
              'text-orange-600'}`} 
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p 
                className="text-2xl font-bold tracking-tight" 
                data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {value.toLocaleString()}
              </p>
              {trend && (
                <span 
                  className={`text-xs font-semibold inline-flex items-center ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <span className="mr-0.5">{trend.isPositive ? '↑' : '↓'}</span>
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {trend && (
        <div 
          className={`absolute bottom-0 left-0 h-1 transition-all ${
            trend.isPositive ? 'bg-green-500' : 'bg-red-500'
          }`} 
          style={{ 
            width: `${Math.min(Math.abs(trend.value), 100)}%`,
            opacity: 0.5 
          }} 
        />
      )}
    </Card>
  );
}
