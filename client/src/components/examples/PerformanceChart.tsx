import PerformanceChart from '../PerformanceChart';

export default function PerformanceChartExample() {
  const data = [
    { name: 'Quiz 1', score: 85, average: 78 },
    { name: 'Quiz 2', score: 92, average: 82 },
    { name: 'Quiz 3', score: 78, average: 75 },
    { name: 'Quiz 4', score: 88, average: 80 },
    { name: 'Quiz 5', score: 95, average: 85 },
  ];

  return (
    <div className="p-6">
      <PerformanceChart data={data} title="Quiz Performance Trend" />
    </div>
  );
}
