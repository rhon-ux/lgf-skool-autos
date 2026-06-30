import { useState } from "react";
import logo from "../../assets/logo.png";

const VALID_ADMIN_EMAIL = "rhon@letsgetfunded.com";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage({ loginForm, setLoginForm, loginError, onLogin }) {
  const [view, setView] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async () => {
    setResetError("");
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(resetEmail)) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (resetEmail.toLowerCase() !== VALID_ADMIN_EMAIL) {
      setResetError("No admin account found for that email.");
      setResetLoading(false);
      return;
    }

    setResetLoading(false);
    setView("reset-sent");
  };

  const goToSignIn = () => {
    setView("signin");
    setResetEmail("");
    setResetError("");
    setResetLoading(false);
  };

  const goToForgot = () => {
    setResetEmail(loginForm.email);
    setResetError("");
    setView("forgot");
  };

  return (
    <div className="admin login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-brand">
            <div className="login-logo">
              {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> */}
              <img src={logo} alt="Let's Get Funded" className="login-logo-img" width={18} height={18} />
            </div>
            <span className="login-title">Let's Get Funded</span>
          </div>
          <p className="login-subtitle">Admin Panel</p>
        </div>

        <div className="login-card">
          {view === "signin" && (
            <>
              <h2 className="login-heading">Sign in</h2>
              {loginError && <div className="login-error">{loginError}</div>}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="rhon@letsgetfunded.com"
                  onKeyDown={e => e.key === "Enter" && onLogin()}
                />
              </div>
              <div className="form-group">
                <label className="form-label login-label-row">
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === "Enter" && onLogin()}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={onLogin}>Sign in</button>
              {!import.meta.env.PROD && (
                <p className="login-demo">Demo: rhon@letsgetfunded.com / admin123</p>
              )}
              <button type="button" className="login-forgot-link" onClick={goToForgot}>
                    Forgot password?
                  </button>
            </>
          )}

          {view === "forgot" && (
            <>
              <h2 className="login-heading">Reset password</h2>
              <p className="login-forgot-desc">
                Enter your admin email and we'll send you a link to reset your password.
              </p>
              {resetError && <div className="login-error">{resetError}</div>}
              <div className="form-group form-group--lg">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="rhon@letsgetfunded.com"
                  onKeyDown={e => e.key === "Enter" && !resetLoading && handleForgotPassword()}
                  disabled={resetLoading}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send reset link"}
              </button>
              <button type="button" className="login-back-link" onClick={goToSignIn}>
                ← Back to sign in
              </button>
            </>
          )}

          {view === "reset-sent" && (
            <>
              <h2 className="login-heading">Check your email</h2>
              <div className="login-success">
                We sent password reset instructions to <strong>{resetEmail}</strong>.
                Check your inbox and follow the link to choose a new password.
              </div>
              <p className="login-forgot-desc">Didn't receive it? Check spam or try again in a few minutes.</p>
              <button type="button" className="btn btn-primary" onClick={goToSignIn}>
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
