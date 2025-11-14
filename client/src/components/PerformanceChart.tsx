import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PerformanceChartProps {
  data: {
    name: string;
    score: number;
    average?: number;
  }[];
  title: string;
  height?: number;
}

export default function PerformanceChart({ data, title, height = 300 }: PerformanceChartProps) {
  return (
    <Card className="p-6" data-testid="performance-chart">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))'
              }}
            />
            <Bar 
              dataKey="score" 
              fill="hsl(var(--primary))" 
              name="Score" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            {data[0]?.average !== undefined && (
              <Bar 
                dataKey="average" 
                fill="hsl(var(--secondary))" 
                name="Class Average" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
