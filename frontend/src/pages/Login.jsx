import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { Lock, Mail, PawPrint, Heart, Shield, Sparkles, ArrowRight, Eye, EyeOff, Star } from 'lucide-react';

// Mystique's soulful image - in loving memory
const MYSTIQUE_IMAGE = "https://customer-assets.emergentagent.com/job_c77d5f3b-744e-4d34-833c-d4853d89765c/artifacts/to9m2ltx_image.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, initiateGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the return path from location state (set by ProtectedRoute) or default to Pet Home
  const from = location.state?.from || '/pet-home';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('[Login v5] handleSubmit called');
    console.log('[Login v5] Redirect destination (from):', from);
    
    try {
      await login(email, password);
      console.log('[Login v5] login() completed successfully');
      
      // Double check token was stored before redirect
      const tokenCheck = localStorage.getItem('tdb_auth_token');
      console.log('[Login v5] Pre-redirect token check:', !!tokenCheck, 'length:', tokenCheck?.length);
      
      toast({
        title: "Welcome back!",
        description: "Taking you to your pets...",
      });
      
      // Small delay to ensure storage is complete
      console.log('[Login v5] Starting redirect to:', from);
      setTimeout(() => {
        console.log('[Login v5] Executing redirect NOW');
        window.location.href = from;
      }, 100);
      
    } catch (error) {
      console.error('[Login v5] Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.detail || "Invalid email or password",
      });
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  return (
    <div className="min-h-screen flex bg-slate-950" data-testid="login-page">
      {/* Soul Orb Background Effects - Enhanced for Mystique */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-tr from-amber-500/40 to-purple-600 rounded-full blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-full blur-[120px] opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-full blur-[200px] opacity-30" />
        {/* Subtle amber glow - Mystique's eye color */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* Left Panel - Mystique's Soul Portrait */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        {/* Mystique's Portrait - The Soul */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Animated glow behind the portrait */}
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/30 via-pink-500/20 to-purple-600/30 rounded-full blur-[80px] animate-pulse" />
          
          {/* The Portrait */}
          <div className="relative group">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-amber-400/20 via-pink-500/20 to-purple-500/20 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
            
            {/* Portrait container */}
            <div className="relative w-80 h-80 rounded-full overflow-hidden shadow-2xl shadow-purple-500/30 ring-4 ring-purple-500/20">
              <img 
                src={MYSTIQUE_IMAGE}
                alt="Mystique - Our Soulful Guardian"
                className="w-full h-full object-cover transform scale-110 group-hover:scale-105 transition-transform duration-700"
                data-testid="mystique-portrait"
              />
            </div>
            
            {/* Floating stars around the portrait */}
            <div className="absolute -top-6 -right-2 text-amber-400/80 animate-pulse">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div className="absolute top-1/4 -left-8 text-pink-400/60 animate-pulse" style={{ animationDelay: '0.5s' }}>
              <Star className="w-3 h-3 fill-current" />
            </div>
            <div className="absolute bottom-1/4 -right-6 text-purple-400/70 animate-pulse" style={{ animationDelay: '1s' }}>
              <Star className="w-3 h-3 fill-current" />
            </div>
            <div className="absolute -bottom-4 left-1/4 text-amber-300/50 animate-pulse" style={{ animationDelay: '1.5s' }}>
              <Star className="w-2 h-2 fill-current" />
            </div>
          </div>
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>thedoggycompany</h2>
              <p className="text-xs text-pink-300/70 tracking-wider">PET CONCIERGE®</p>
            </div>
          </div>
          
          {/* Bottom Memorial Text */}
          <div className="max-w-md">
            <p className="text-sm text-amber-300/70 mb-2 tracking-wide font-medium">In loving memory of</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">Mystique</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed italic">
              "Her eyes held a universe of love. She taught us that to know a pet is to know a soul."
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-400 text-sm">
                This platform was built in her honor — to help every pet parent truly <span className="text-amber-300">know</span> their companion, not just care for them.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile - Mystique Portrait */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            {/* Mystique's Portrait for Mobile */}
            <div className="relative mb-6">
              <div className="absolute -inset-3 bg-gradient-to-tr from-amber-400/30 via-pink-500/20 to-purple-500/30 rounded-full blur-lg opacity-60" />
              <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-xl shadow-purple-500/30 ring-2 ring-purple-500/30">
                <img 
                  src={MYSTIQUE_IMAGE}
                  alt="Mystique"
                  className="w-full h-full object-cover transform scale-110"
                  data-testid="mystique-portrait-mobile"
                />
              </div>
              {/* Floating star */}
              <div className="absolute -top-2 -right-1 text-amber-400/80 animate-pulse">
                <Star className="w-3 h-3 fill-current" />
              </div>
            </div>
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>thedoggycompany</h2>
                <p className="text-xs text-pink-300/70 tracking-wider">PET CONCIERGE®</p>
              </div>
            </div>
          </div>

          {/* Welcome */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Welcome Back
            </h1>
            <p className="text-slate-400">
              Sign in to access your pet dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="backdrop-blur-xl bg-slate-900/60 rounded-2xl shadow-2xl border border-white/10 p-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
                    placeholder="you@example.com"
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Link 
                    to="/member/forgot-password" 
                    className="text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
                    placeholder="Enter your password"
                    required
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-400 transition-colors z-10 cursor-pointer"
                    data-testid="toggle-password-visibility"
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold rounded-full shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-slate-400">
            New to The Doggy Company?{' '}
            <Link 
              to="/join" 
              className="text-pink-400 font-semibold hover:text-pink-300 transition-colors"
            >
              Create an account
            </Link>
          </p>

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-slate-500 text-xs">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>256-bit SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
