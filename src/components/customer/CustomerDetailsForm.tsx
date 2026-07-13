"use client";

import Link from "next/link";
import { useState } from "react";
import type { CustomerProfile } from "@/lib/customer/get-customer";

type Props = {
  customer: CustomerProfile;
};

export default function CustomerDetailsForm({ customer }: Props) {
  const [firstName, setFirstName] = useState(customer.firstName ?? "");
  const [lastName, setLastName] = useState(customer.lastName ?? "");
  const [changeEmail, setChangeEmail] = useState(false);
  const [email, setEmail] = useState(customer.email);
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          changeEmail,
          email: changeEmail ? email : undefined,
          changePassword,
          currentPassword: changePassword ? currentPassword : undefined,
          password: changePassword ? password : undefined,
          passwordConfirmation: changePassword ? passwordConfirmation : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");

      setSuccess("Your account information has been saved.");
      if (changePassword) {
        setCurrentPassword("");
        setPassword("");
        setPasswordConfirmation("");
        setChangePassword(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form form-edit-account" onSubmit={handleSubmit} id="form-validate" autoComplete="off">
      <div className="hidden md:block bg-white rounded-lg p-5">
        <h1 className="text-2xl flex items-center">
          <svg
            width="17"
            height="20"
            viewBox="0 0 17 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current fill-transparent w-5 h-5 mr-2"
          >
            <circle cx="8.33408" cy="4.68955" r="3.68955" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M15.8966 18.5255C15.8966 15.1378 12.5619 12.3916 8.44828 12.3916C4.33471 12.3916 1 15.1378 1 18.5255"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Account Information
        </h1>
        <p className="mt-2 text-sm text-grey-dark">
          Welcome to 4gadgets! Check your details are correct for your recent order, use the links
          below to answer any questions you have, or trade-in your old device by switching the toggle
          in the top right of the page.
        </p>
      </div>

      <Link
        href="/sell-my/customer/account"
        className="block md:hidden bg-white rounded-lg p-5 text-2xl font-medium flex items-center"
      >
        <svg width="23" height="20" viewBox="0 0 23 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current">
          <path d="M22 10.75C22.4142 10.75 22.75 10.4142 22.75 10C22.75 9.58579 22.4142 9.25 22 9.25L22 10.75ZM1 10L0.475165 9.46423C0.331157 9.6053 0.250001 9.79841 0.250001 10C0.250001 10.2016 0.331157 10.3947 0.475166 10.5358L1 10ZM9.66267 19.5358C9.95856 19.8256 10.4334 19.8207 10.7233 19.5248C11.0131 19.2289 11.0082 18.7541 10.7123 18.4642L9.66267 19.5358ZM10.7123 1.53577C11.0082 1.24591 11.0131 0.771066 10.7233 0.475167C10.4334 0.179271 9.95856 0.174377 9.66266 0.464234L10.7123 1.53577ZM22 9.25L1 9.25L1 10.75L22 10.75L22 9.25ZM10.7123 18.4642L1.52484 9.46423L0.475166 10.5358L9.66267 19.5358L10.7123 18.4642ZM1.52484 10.5358L10.7123 1.53577L9.66266 0.464234L0.475165 9.46423L1.52484 10.5358Z" />
        </svg>
        <span className="ml-4">Account Information</span>
      </Link>

      <div className="bg-white rounded-lg p-5 pt-2 mt-5">
        <fieldset className="fieldset info">
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

          <div className="field choice">
            <input
              type="checkbox"
              name="change_email"
              id="change-email"
              value="1"
              title="Change Email"
              className="checkbox"
              checked={changeEmail}
              onChange={(e) => setChangeEmail(e.target.checked)}
            />
            <label className="label" htmlFor="change-email">
              <span>Change Email</span>
            </label>
          </div>

          <div className="field choice">
            <input
              type="checkbox"
              name="change_password"
              id="change-password"
              value="1"
              title="Change Password"
              className="checkbox"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
            />
            <label className="label" htmlFor="change-password">
              <span>Change Password</span>
            </label>
          </div>

          {changeEmail && (
            <div className="field w-full required">
              <label className="label" htmlFor="email">
                <span>Email</span>
              </label>
              <div className="control">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input w-full"
                />
              </div>
            </div>
          )}

          {changePassword && (
            <>
              <div className="field w-full required">
                <label className="label" htmlFor="current-password">
                  <span>Current Password</span>
                </label>
                <div className="control">
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="form-input w-full"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="field w-full required">
                <label className="label" htmlFor="password">
                  <span>New Password</span>
                </label>
                <div className="control">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="form-input w-full"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="field w-full required">
                <label className="label" htmlFor="password-confirmation">
                  <span>Confirm New Password</span>
                </label>
                <div className="control">
                  <input
                    type="password"
                    id="password-confirmation"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    minLength={8}
                    className="form-input w-full"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </>
          )}
        </fieldset>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        {success && <p className="text-sm text-green-darker mt-4">{success}</p>}

        <div className="actions-toolbar border-0 padding-0 mt-6">
          <div className="primary">
            <button type="submit" className="action save primary btn btn-primary" title="Save" disabled={loading}>
              <span>{loading ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
