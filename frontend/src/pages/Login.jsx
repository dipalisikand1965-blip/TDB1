import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { Lock, Mail, PawPrint, Heart, Shield, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, initiateGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the return path from location state (set by ProtectedRoute) or default to /mira-demo
  const from = location.state?.from || '/mira-demo';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      // Navigate back to the page user was trying to access, or to Mira OS
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.detail || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  return (
    <div className="min-h-screen flex bg-slate-950" data-testid="login-page">
      {/* Soul Orb Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-full blur-[120px] opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-full blur-[200px] opacity-30" />
      </div>

      {/* Left Panel - Hero Image & Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1477936432016-8172ed08637e?w=1200&q=80"
          alt="Soulful dog portrait"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Dark Overlay with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        
        {/* Soul Orb Effect on Image */}
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full blur-[100px] opacity-30 mix-blend-soft-light" />
        
        {/* Content */}
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
          
          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Welcome to<br/>
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Pet Soul™</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Your pet's digital guardian. Track health, celebrate moments, and nurture the bond that makes life beautiful.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Heart, text: "Personalized care recommendations", color: "text-pink-400" },
                { icon: Shield, text: "24/7 emergency support", color: "text-purple-400" },
                { icon: Sparkles, text: "Exclusive member rewards", color: "text-indigo-400" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-slate-700/50 group-hover:border-pink-500/50 transition-colors">
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <span className="text-slate-300 group-hover:text-white transition-colors">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Testimonial Card */}
          <div className="backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 max-w-md shadow-2xl">
            <div className="flex items-start gap-4">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="Member"
                className="w-12 h-12 rounded-full object-cover border-2 border-pink-500/30"
              />
              <div>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  "Pet Soul has transformed how I care for my pets. The personalized recommendations and quick support are amazing!"
                </p>
                <p className="text-white font-semibold text-sm">Priya Sharma</p>
                <p className="text-slate-500 text-xs">Member since 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>thedoggycompany</h2>
              <p className="text-xs text-pink-300/70 tracking-wider">PET CONCIERGE®</p>
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-400 transition-colors"
                    data-testid="toggle-password-visibility"
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
