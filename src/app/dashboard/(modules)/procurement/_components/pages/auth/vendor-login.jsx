import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, Lock, Mail, Store, Award, EyeOff, FileCheck, DollarSign } from 'lucide-react';

import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/auth-context';
export function VendorLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password, 'vendor');
    navigate('/vendor-portal/dashboard');
  };
  const fillDemoCredentials = () => {
    setEmail('vendor@techbd.com.bd');
    setPassword('vendor123');
  };
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Vendor Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Store className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vendor Portal</h1>
              <p className="text-sm text-white/80">ProcureMax Network</p>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Your Gateway to
              <br />
              Business Opportunities
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Connect with leading organizations, submit quotations, and manage contracts
              seamlessly.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">RFQ Management</h3>
              <p className="text-white/80 text-sm">Respond to quotation requests efficiently</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Contract Awards</h3>
              <p className="text-white/80 text-sm">Track your won contracts and orders</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Payment Tracking</h3>
              <p className="text-white/80 text-sm">Monitor invoices and payment status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-emerald-600">Vendor Portal</h1>
            </div>
            <p className="text-sm text-muted-foreground">ProcureMax Network</p>
          </div>

          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-emerald-600/10 text-emerald-700 text-xs font-semibold rounded-full mb-4">
              VENDOR PORTAL ACCESS
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Vendor Sign In</h2>
            <p className="text-muted-foreground">Access your vendor dashboard and manage RFQs</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Vendor Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-foreground cursor-pointer">
                  Remember me
                </label>
              </div>
              <Link to="/auth/forgot-password" className="text-sm text-emerald-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              Sign In to Vendor Portal
            </Button>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full py-2 text-sm text-muted-foreground hover:text-emerald-600 border border-dashed border-muted-foreground/30 hover:border-emerald-600/50 rounded-lg transition-colors"
            >
              Fill Demo Credentials
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Not registered yet?{' '}
                <Link
                  to="/auth/vendor-registration"
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Apply for Vendor Registration
                </Link>
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Internal user?{' '}
                <Link
                  to="/auth/internal-login"
                  className="text-primary font-semibold hover:underline"
                >
                  Access Internal Portal
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Secure vendor access with encrypted communication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
