import { type FormEvent, type ReactElement, useId, useState } from 'react';
import { ApiError } from '../../common/problem';
import { register } from './auth.api';

type Field = 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

// Mirrors RegisterBody on the server; the server stays the authority
const MIN_PASSWORD_LENGTH = 12;

// Client-side checks only give faster feedback; the API validates again
function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (email.trim().length === 0) {
    errors.email = 'Please enter your e-mail address.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `The password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
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

export function RegisterForm(): ReactElement {
  // Unique ids, so label/aria wiring cannot collide with other forms on the page
  const id = useId();
  const headingId = `${id}-heading`;
  const emailId = `${id}-email`;
  const emailErrorId = `${id}-email-error`;
  const passwordId = `${id}-password`;
  const passwordHintId = `${id}-password-hint`;
  const passwordErrorId = `${id}-password-error`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Errors that belong to no single field (network, 429, 500)
  const [formError, setFormError] = useState<string | null>(null);
  // Confirmation, announced via the always-present status region
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (): Promise<void> => {
    const errors = validate(email, password);
    setFieldErrors(errors);
    setFormError(null);
    setNotice('');
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // The password is sent exactly as typed: never trim or alter it
      await register(email.trim(), password);
      setNotice(`Account created for ${email.trim()}.`);
      setEmail('');
      setPassword('');
    } catch (error: unknown) {
      if (!(error instanceof ApiError)) {
        setFormError(
          'Error: The account could not be created. Please try again.'
        );
        return;
      }
      const fromServer = fieldErrorsFrom(error);
      if (error.problem.status === 409) {
        setFieldErrors({
          email:
            error.problem.detail ??
            'This e-mail address is already registered.',
        });
      } else if (Object.keys(fromServer).length > 0) {
        setFieldErrors(fromServer);
      } else {
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

  // Hint always, error only when present
  const passwordDescribedBy =
    fieldErrors.password !== undefined
      ? `${passwordHintId} ${passwordErrorId}`
      : passwordHintId;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Create an account</h2>
      <form className="comment-form" onSubmit={handleSubmit} noValidate>
        <div className="flex-pair">
          <label htmlFor={emailId}>E-mail:</label>
          <input
            type="email"
            name="email"
            id={emailId}
            autoComplete="email"
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
          {/* No maxLength: it would silently cut a pasted or generated password;
              the server answers 400 above 128 characters instead.
              minLength tells password managers how long to generate. */}
          <input
            type="password"
            name="password"
            id={passwordId}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            aria-invalid={fieldErrors.password !== undefined}
            aria-describedby={passwordDescribedBy}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </div>
        {/* NIST SP 800-63B: length is the only rule, no composition hints */}
        <p id={passwordHintId}>
          At least {MIN_PASSWORD_LENGTH} characters, no other rules. A long
          passphrase works best. ({password.length} so far)
        </p>
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
        <p role="status">{notice}</p>

        <div>
          <input
            type="submit"
            value={submitting ? 'Creating account…' : 'Create account'}
            disabled={submitting}
          />
        </div>
      </form>
    </section>
  );
}
