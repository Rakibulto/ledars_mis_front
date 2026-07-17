import { Link, useNavigate } from 'react-router';
import { Shield, ArrowLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

import { Button } from '../../components/ui/button';
export function VerifyOTP() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    setCanResend(true);
  }, [timer]);
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleSubmit(newOtp.join(''));
    }
  };
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    // Focus last filled input
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
    // Auto-submit if 6 digits pasted
    if (pastedData.length === 6) {
      handleSubmit(pastedData);
    }
  };
  const handleSubmit = (otpValue) => {
    // Simulate OTP verification
    // console.log('Verifying OTP:', otpValue);
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };
  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };
  const fillDemoOTP = () => {
    const demoOtp = ['1', '2', '3', '4', '5', '6'];
    setOtp(demoOtp);
    inputRefs.current[5]?.focus();
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Verify Your Identity</h2>
          <p className="text-muted-foreground mb-1">We've sent a 6-digit verification code to</p>
          <p className="text-foreground font-semibold">admin@procuremax.com</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-4 text-center">
              Enter Verification Code
            </label>
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={() => handleSubmit(otp.join(''))}
            className="w-full"
            size="lg"
            disabled={otp.some((digit) => digit === '')}
          >
            Verify Code
          </Button>

          <button
            type="button"
            onClick={fillDemoOTP}
            className="w-full py-2 text-sm text-muted-foreground hover:text-primary border border-dashed border-muted-foreground/30 hover:border-primary/50 rounded-lg transition-colors"
          >
            Fill Demo OTP (123456)
          </button>

          <div className="text-center pt-4">
            {!canResend ? (
              <p className="text-sm text-muted-foreground">
                Resend code in{' '}
                <span className="font-semibold text-foreground">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Resend Verification Code
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">Security Tip:</strong> Never share your
                verification code with anyone. Our team will never ask for this code.
              </p>
            </div>

            <div className="text-center">
              <Link
                to="/auth/internal-login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
