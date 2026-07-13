"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function createAccountHref(returnUrl: string) {
  return `/sell-my/customer/account/create?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export default function CustomerLoginForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/sell-my/customer/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      window.location.href = returnUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="customer-login-container" className="login-container container">
      <div className="w-full md:w-1/2 card mr-4">
        <div aria-labelledby="block-customer-login-heading">
          <form
            className="form form-login"
            onSubmit={handleSubmit}
            id="customer-login-form"
            noValidate
          >
            <fieldset className="fieldset login">
              <legend className="mb-3">
                <h2 className="text-xl title-font text-primary">Login</h2>
              </legend>
              <div className="text-secondary-darker mb-8">
                If you have an account, sign in with your email address.
              </div>

              <div className="field email required">
                <label className="label" htmlFor="email">
                  <span>Email</span>
                </label>
                <div className="control">
                  <input
                    name="login[username]"
                    className="form-input w-full"
                    autoComplete="email"
                    id="email"
                    type="email"
                    title="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field password required">
                <label htmlFor="pass" className="label">
                  <span>Password</span>
                </label>
                <div className="control">
                  <input
                    name="login[password]"
                    className="form-input w-full"
                    type="password"
                    autoComplete="current-password"
                    id="pass"
                    title="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="message error mt-4">
                  <div>{error}</div>
                </div>
              )}

              <div className="actions-toolbar flex justify-between pt-6 pb-2 items-center">
                <button type="submit" className="btn btn-primary" name="send" disabled={loading}>
                  <span>{loading ? "Signing in..." : "Sign In"}</span>
                </button>
                <Link
                  className="underline text-secondary"
                  href="/sell-my/customer/account/forgotpassword"
                >
                  <span>Forgot Your Password?</span>
                </Link>
              </div>
            </fieldset>
          </form>
        </div>
      </div>

      <div className="block-new-customer card w-full md:w-1/2 my-8 md:my-0">
        <div className="block-title">
          <h2 className="text-xl title-font mb-3 text-primary" role="heading" aria-level={2}>
            New Customers
          </h2>
        </div>
        <div className="block-content" aria-labelledby="block-new-customer-heading">
          <p>
            Creating an account has many benefits: check out faster, keep more than one address,
            track orders and more. If this is your first time on our new website, you will need to
            create an account. Your old account details will no longer be active.
          </p>
          <br />
          <p>
            To receive a stock notification we require your email address. Please login or register
            an account and when the product is back in stock, you will be notified by email
            immediately.
          </p>
          <br />
          <p>
            Your email address will not be used for any other purpose, unless you opt-in within your
            account.
          </p>
        </div>
        <div className="actions-toolbar pt-6 pb-2 flex self-end">
          <Link href={createAccountHref(returnUrl)} className="btn btn-primary">
            <span>Create an Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
