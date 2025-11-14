import NoticeCard from '../NoticeCard';

export default function NoticeCardExample() {
  return (
    <div className="space-y-4 p-6 max-w-2xl">
      <NoticeCard
        _id="1"
        title="Annual Sports Day"
        content="The annual sports day will be held on December 15th. All students are requested to participate actively."
        postedBy={{ _id: "principal", name: "Principal" }}
        createdAt="2 hours ago"
        priority="high"
        audience="all"
      />
      <NoticeCard
        _id="2"
        title="Parent-Teacher Meeting"
        content="PTM scheduled for next Saturday from 9 AM to 2 PM. Parents are requested to meet respective class teachers."
        postedBy={{ _id: "admin", name: "Admin" }}
        createdAt="1 day ago"
        priority="medium"
        audience="all"
      />
    </div>
  );
}
