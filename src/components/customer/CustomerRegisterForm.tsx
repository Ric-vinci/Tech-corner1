"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function passwordCharacterClasses(password: string): number {
  let classes = 0;
  if (/[a-z]/.test(password)) classes++;
  if (/[A-Z]/.test(password)) classes++;
  if (/\d/.test(password)) classes++;
  if (/[^a-zA-Z0-9]/.test(password)) classes++;
  return classes;
}

function loginHref(returnUrl: string) {
  return `/sell-my/customer/account/login?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export default function CustomerRegisterForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/sell-my/customer/account";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [passwordsMatching, setPasswordsMatching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function checkPasswordsMatch(nextPassword = password, nextConfirmation = passwordConfirmation) {
    const matching = !nextConfirmation || nextPassword === nextConfirmation;
    setPasswordsMatching(matching);
    return matching;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!checkPasswordsMatch()) {
      setError("Your password confirmation must match your password.");
      return;
    }

    if (password.length < 8 || passwordCharacterClasses(password) < 3) {
      setError(
        "Password must be at least 8 characters and include 3 of: lower case, upper case, digits, special characters."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          newsletter,
          smsMarketing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      window.location.href = returnUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="registation-container container p-0 flex-columns-wrapper">
      <div className="mb-8">
        <form
          className="form create account form-create-account"
          onSubmit={handleSubmit}
          id="accountcreate"
          autoComplete="off"
          noValidate
        >
          <div className="md:grid grid-cols-2 gap-4">
            <fieldset className="my-8 card">
              <legend className="contents">
                <span>Personal Information</span>
              </legend>

              <div className="field w-full field-name-firstname required">
                <label className="label" htmlFor="firstname">
                  <span>First Name</span>
                </label>
                <div className="control">
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    title="First Name"
                    className="form-input w-full required-entry"
                  />
                </div>
              </div>

              <div className="field w-full field-name-lastname required">
                <label className="label" htmlFor="lastname">
                  <span>Last Name</span>
                </label>
                <div className="control">
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    title="Last Name"
                    className="form-input w-full required-entry"
                  />
                </div>
              </div>

              <div className="field choice newsletter">
                <input
                  type="checkbox"
                  name="is_subscribed"
                  title="Sign Up for Newsletter"
                  value="1"
                  id="is_subscribed"
                  className="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <label htmlFor="is_subscribed" className="label">
                  <span>Sign Up for Newsletter</span>
                </label>
              </div>
            </fieldset>

            <fieldset className="my-8 card">
              <legend className="contents">
                <span>Sign-in Information</span>
              </legend>

              <div className="field required">
                <label htmlFor="email_address" className="label">
                  <span>Email</span>
                </label>
                <div className="control">
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    id="email_address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    title="Email"
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password" className="label">
                  <span>Password</span>
                </label>
                <div className="control">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    title="Password"
                    minLength={8}
                    className="form-input w-full"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      checkPasswordsMatch(e.target.value, passwordConfirmation);
                    }}
                  />
                </div>
                <p className="text-sm text-secondary mt-3">
                  Minimum of different classes of characters in password is 3. Classes of characters:
                  Lower Case, Upper Case, Digits, Special Characters.
                </p>
              </div>

              <div className="field">
                <label htmlFor="password-confirmation" className="label">
                  <span>Confirm Password</span>
                </label>
                <div className="control">
                  <input
                    type="password"
                    name="password_confirmation"
                    title="Confirm Password"
                    id="password-confirmation"
                    required
                    minLength={8}
                    className="form-input w-full"
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(e) => {
                      setPasswordConfirmation(e.target.value);
                      checkPasswordsMatch(password, e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="field">
                <p className={`my-4 text-red ${passwordsMatching ? "invisible" : "visible"}`}>
                  Your password confirmation must match your password.
                </p>
              </div>

              <fieldset className="fieldset">
                <div className="field choice">
                  <input
                    type="checkbox"
                    name="is_sms_subscribed"
                    id="dd_sms_consent_checkbox"
                    value="1"
                    title="SMS Marketing Subscription"
                    className="checkbox"
                    checked={smsMarketing}
                    onChange={(e) => setSmsMarketing(e.target.checked)}
                  />
                  <label htmlFor="dd_sms_consent_checkbox" className="label">
                    <span>
                      Subscribe to SMS to receive marketing text messages for promotions and basket
                      reminders
                    </span>
                  </label>
                </div>
              </fieldset>

              <p className="my-4 text-sm">
                This form is protected by reCAPTCHA - the{" "}
                <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>{" "}
                and{" "}
                <a className="underline" href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
                  Terms of Service
                </a>{" "}
                apply.
              </p>
            </fieldset>
          </div>

          {error && (
            <div className="message error mb-4">
              <div>{error}</div>
            </div>
          )}

          <div className="actions-toolbar flex">
            <div className="primary">
              <button
                type="submit"
                className="action submit primary btn btn-primary"
                title="Create an Account"
                disabled={loading}
              >
                <span>{loading ? "Creating account..." : "Create an Account"}</span>
              </button>
            </div>
            <div className="secondary ml-4 self-center">
              <Link className="action back" href={loginHref(returnUrl)}>
                <span>Back</span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
