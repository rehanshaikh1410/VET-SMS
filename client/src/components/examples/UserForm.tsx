import UserForm from '../UserForm';

export default function UserFormExample() {
  return (
    <div className="p-6 space-y-6">
      <UserForm type="student" />
      <UserForm type="teacher" />
    </div>
  );
}
