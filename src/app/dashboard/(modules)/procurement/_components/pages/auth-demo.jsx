'use client';

import Link from 'next/link';
import { Mail, Lock, Store, Shield, KeyRound } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
export function AuthDemo() {
  const authScreens = [
    {
      id: 'internal-login',
      title: 'Internal User Login',
      description: 'Access internal procurement portal',
      icon: Shield,
      color: 'bg-primary',
      path: '/auth/internal-login',
      credentials: 'admin@procuremax.com / demo123',
    },
    {
      id: 'vendor-login',
      title: 'Vendor Portal Login',
      description: 'Vendor access to RFQs and contracts',
      icon: Store,
      color: 'bg-emerald-600',
      path: '/auth/vendor-login',
      credentials: 'vendor@supplier.com / vendor123',
    },
    {
      id: 'forgot-password',
      title: 'Forgot Password',
      description: 'Request password reset link',
      icon: Mail,
      color: 'bg-blue-600',
      path: '/auth/forgot-password',
      credentials: null,
    },
    {
      id: 'reset-password',
      title: 'Reset Password',
      description: 'Create new password with validation',
      icon: KeyRound,
      color: 'bg-purple-600',
      path: '/auth/reset-password',
      credentials: null,
    },
    {
      id: 'verify-otp',
      title: 'OTP Verification',
      description: 'Email/SMS verification screen',
      icon: Lock,
      color: 'bg-orange-600',
      path: '/auth/verify-otp',
      credentials: 'Demo OTP: 123456',
    },
  ];
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Authentication Screens</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Professional enterprise-grade authentication for both internal users and vendors
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authScreens.map((screen) => {
            const Icon = screen.icon;
            return (
              <Card key={screen.id} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="mb-4">
                    <div
                      className={`inline-flex w-14 h-14 ${screen.color} rounded-lg items-center justify-center mb-3`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{screen.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{screen.description}</p>
                    {screen.credentials && (
                      <div className="bg-muted/50 border border-border rounded px-3 py-2 mb-4">
                        <p className="text-xs font-mono text-muted-foreground">
                          {screen.credentials}
                        </p>
                      </div>
                    )}
                  </div>
                  <Link href={screen.path}>
                    <Button className="w-full">View Screen</Button>
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Features Implemented</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Dual Portal Access</h3>
                <p className="text-sm text-muted-foreground">
                  Separate authentication flows for internal users and vendors
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Demo Credentials</h3>
                <p className="text-sm text-muted-foreground">
                  One-click demo credential fill for testing
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Password Recovery</h3>
                <p className="text-sm text-muted-foreground">
                  Complete forgot/reset password flow with email confirmation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">OTP Verification</h3>
                <p className="text-sm text-muted-foreground">
                  6-digit OTP input with auto-focus and paste support
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Password Validation</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time password strength checking with visual feedback
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Branded Illustrations</h3>
                <p className="text-sm text-muted-foreground">
                  Abstract side panels with brand colors and features
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Responsive Design</h3>
                <p className="text-sm text-muted-foreground">
                  Mobile-friendly layouts that adapt to all screen sizes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Role Labels</h3>
                <p className="text-sm text-muted-foreground">
                  Clear visual indicators for portal type (Internal vs Vendor)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
