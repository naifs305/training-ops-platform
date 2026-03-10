import { useAuth } from '../../context/AuthContext';

export default function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center rounded-full border border-border bg-white p-1 shadow-sm">
      {user.roles.map((role) => (
        <button
          key={role}
          onClick={() => switchRole(role)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            activeRole === role
              ? 'bg-primary text-white shadow-soft'
              : 'text-text-soft hover:bg-primary-light hover:text-primary'
          }`}
        >
          {role === 'MANAGER' ? 'مدير' : 'موظف'}
        </button>
      ))}
    </div>
  );
}