import { type ReactElement, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from './AuthContext';

export function UserMenu(): ReactElement {
  const { user, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Announced after logout, when the button the user pressed has disappeared
  const [notice, setNotice] = useState('');

  const handleLogout = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await logout();
      setNotice('You are logged out.');
    } catch {
      // The token may still be valid, so do not pretend the logout worked
      setError('Logout failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  let content: ReactElement | null;
  if (loading) {
    // Nothing yet: avoids flashing "Log in" for a user who is logged in
    content = null;
  } else if (user === null) {
    content = (
      <>
        <Link to="/login">Log in</Link>
        <Link to="/register">Register</Link>
      </>
    );
  } else {
    content = (
      <>
        <span>
          Signed in as <strong>{user.email}</strong>
          {user.role === 'moderator' && ' (moderator)'}
        </span>
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          disabled={busy}
        >
          {busy ? 'Logging out…' : 'Log out'}
        </button>
      </>
    );
  }

  return (
    <div className="user-menu" aria-busy={loading}>
      {content}
      {error !== null && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {/* Always rendered in the same place, so screen readers announce changes */}
      <p role="status" className="sr-only">
        {notice}
      </p>
    </div>
  );
}
