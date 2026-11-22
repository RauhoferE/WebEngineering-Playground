import { type FormEvent, type ReactElement, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../common/problem';
import { login } from './auth.api';
import { useAuth } from './AuthContext';

type Field = 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (email.trim().length === 0) {
    errors.email = 'Please enter your e-mail address.';
  }
  if (password.length === 0) {
    errors.password = 'Please enter your password.';
  }
  return errors;
}

// Maps the errors[] of a 400 Problem (path "email" / "password") onto the fields
function fieldErrorsFrom(error: ApiError): FieldErrors {
  const errors: FieldErrors = {};
  for (const { path, message } of error.problem.errors ?? []) {
    if (
      (path === 'email' || path === 'password') &&
      errors[path] === undefined
    ) {
      errors[path] = message;
    }
  }
  return errors;
}

export function LoginForm(): ReactElement {
  const id = useId();
  const headingId = `${id}-heading`;
  const emailId = `${id}-email`;
  const emailErrorId = `${id}-email-error`;
  const passwordId = `${id}-password`;
  const passwordErrorId = `${id}-password-error`;

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // 401 lands here, never on a field: the answer must not say which one was wrong
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (): Promise<void> => {
    const errors = validate(email, password);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // The password is sent exactly as typed: never trim or alter it
      const user = await login(email.trim(), password);
      setUser(user);
      // replace: the back button should not lead back to the login form
      void navigate('/', { replace: true });
    } catch (error: unknown) {
      setPassword('');
      if (!(error instanceof ApiError)) {
        setFormError('Error: Could not log in. Please try again.');
        return;
      }
      const fromServer = fieldErrorsFrom(error);
      if (error.problem.status === 400 && Object.keys(fromServer).length > 0) {
        setFieldErrors(fromServer);
      } else {
        // 401 "Invalid e-mail or password.", later 429 with Retry-After (Task 4)
        setFormError(`Error: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void submit();
  };

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Log in</h2>
      <form className="comment-form" onSubmit={handleSubmit} noValidate>
        <div className="flex-pair">
          <label htmlFor={emailId}>E-mail:</label>
          <input
            type="email"
            name="email"
            id={emailId}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={fieldErrors.email !== undefined}
            aria-describedby={
              fieldErrors.email !== undefined ? emailErrorId : undefined
            }
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        {fieldErrors.email !== undefined && (
          <p id={emailErrorId} role="alert" className="form-error">
            {fieldErrors.email}
          </p>
        )}

        <div className="flex-pair">
          <label htmlFor={passwordId}>Password:</label>
          <input
            type="password"
            name="password"
            id={passwordId}
            autoComplete="current-password"
            required
            aria-invalid={fieldErrors.password !== undefined}
            aria-describedby={
              fieldErrors.password !== undefined ? passwordErrorId : undefined
            }
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </div>
        {fieldErrors.password !== undefined && (
          <p id={passwordErrorId} role="alert" className="form-error">
            {fieldErrors.password}
          </p>
        )}

        {formError !== null && (
          <p role="alert" className="form-error">
            {formError}
          </p>
        )}

        <div>
          <input
            type="submit"
            value={submitting ? 'Logging in…' : 'Log in'}
            disabled={submitting}
          />
        </div>
      </form>
      <p>
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </section>
  );
}
