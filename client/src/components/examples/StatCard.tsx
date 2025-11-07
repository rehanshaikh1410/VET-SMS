import StatCard from '../StatCard';
import { Users } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      <StatCard title="Total Students" value={1245} icon={Users} trend={{ value: 12, isPositive: true }} />
      <StatCard title="Total Teachers" value={87} icon={Users} iconColor="bg-chart-2" />
      <StatCard title="Active Classes" value={24} icon={Users} iconColor="bg-chart-3" trend={{ value: 5, isPositive: false }} />
      <StatCard title="Pending Quizzes" value={8} icon={Users} iconColor="bg-chart-4" />
    </div>
  );
}
