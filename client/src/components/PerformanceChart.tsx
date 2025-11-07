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
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="score" fill="hsl(var(--chart-1))" name="Score" radius={[4, 4, 0, 0]} />
          {data[0]?.average !== undefined && (
            <Bar dataKey="average" fill="hsl(var(--chart-2))" name="Class Average" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
