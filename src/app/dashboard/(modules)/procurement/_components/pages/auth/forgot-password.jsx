import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-success/10 rounded-full items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Check Your Email</h2>
            <p className="text-muted-foreground">We've sent password reset instructions to</p>
            <p className="text-foreground font-semibold mt-1">{email}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Didn't receive the email? Check your spam folder or:
            </p>
            <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
              Try another email address
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/auth/internal-login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            to="/auth/internal-login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-2">Forgot Password?</h2>
          <p className="text-muted-foreground">
            No worries! Enter your email address and we'll send you instructions to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Send Reset Instructions
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link to="/auth/internal-login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
