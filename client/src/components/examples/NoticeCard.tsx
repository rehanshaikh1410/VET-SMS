import NoticeCard from '../NoticeCard';

export default function NoticeCardExample() {
  return (
    <div className="space-y-4 p-6 max-w-2xl">
      <NoticeCard
        title="Annual Sports Day"
        content="The annual sports day will be held on December 15th. All students are requested to participate actively."
        postedBy="Principal"
        timestamp="2 hours ago"
        priority="high"
      />
      <NoticeCard
        title="Parent-Teacher Meeting"
        content="PTM scheduled for next Saturday from 9 AM to 2 PM. Parents are requested to meet respective class teachers."
        postedBy="Admin"
        timestamp="1 day ago"
        priority="medium"
      />
    </div>
  );
}
