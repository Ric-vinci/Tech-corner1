import Link from "next/link";
import StoreShell from "@/components/layout/StoreShell";

export const metadata = { title: "Forgot Your Password — 4gadgets" };

export default function ForgotPasswordPage() {
  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main page-layout-1column customer-account-forgotpassword">
        <div className="page-title-wrapper container flex flex-col md:flex-row flex-wrap my-6 font-medium md:mt-10 md:mb-8 text-4xl">
          <h1 className="text-gray-900 page-title title-font">
            <span className="base">Forgot Your Password?</span>
          </h1>
        </div>

        <div className="columns">
          <div className="column main">
            <div className="container">
              <div className="card max-w-xl">
                <p className="text-secondary-darker mb-6">
                  Password reset is not available online yet. Please contact our support team and we
                  will help you regain access to your account.
                </p>
                <Link href="/sell-my/customer/account/login" className="btn btn-primary">
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
