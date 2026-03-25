import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { Lock, Mail, User, Phone, PawPrint, ArrowRight, Heart, Star } from 'lucide-react';

const MYSTIQUE_IMAGE = "https://res.cloudinary.com/duoapcx1p/image/upload/v1774081084/tdc_pets/mystique_real.jpg";
const KOUROS_IMAGE   = "https://res.cloudinary.com/duoapcx1p/image/upload/v1774080461/tdc_pets/kouros_teal.jpg";

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register, initiateGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast({ title: "Welcome to the family!", description: "Your account has been created." });
      navigate('/pet-home');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.detail || "Could not create account",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    initiateGoogleLogin();
  };

  return (
    <div className="min-h-screen flex bg-slate-950" data-testid="register-page">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-tr from-amber-500/30 to-purple-600 rounded-full blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-full blur-[120px] opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-full blur-[200px] opacity-30" />
      </div>

      {/* Left Panel — Portrait (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/30 via-pink-500/20 to-purple-600/30 rounded-full blur-[80px] animate-pulse" />
          <div className="relative flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-tr from-amber-400/20 via-yellow-500/20 to-orange-500/20 rounded-full blur-xl opacity-60" />
              <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/20">
                <img src={KOUROS_IMAGE} alt="Kouros" className="w-full h-full object-cover transform scale-110" />
              </div>
            </div>
            <Heart className="w-6 h-6 text-pink-400 fill-current animate-pulse" />
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-tr from-pink-400/20 via-purple-500/20 to-violet-500/20 rounded-full blur-xl opacity-60" />
              <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-2xl shadow-purple-500/30 ring-4 ring-purple-500/20">
                <img src={MYSTIQUE_IMAGE} alt="Mystique" className="w-full h-full object-cover transform scale-110" />
              </div>
            </div>
          </div>
          <div className="absolute top-1/4 left-1/4 text-amber-400/80 animate-pulse"><Star className="w-4 h-4 fill-current" /></div>
          <div className="absolute top-1/3 right-1/4 text-pink-400/60 animate-pulse" style={{animationDelay:'0.5s'}}><Star className="w-3 h-3 fill-current" /></div>
          <div className="absolute bottom-1/3 left-1/3 text-purple-400/70 animate-pulse" style={{animationDelay:'1s'}}><Star className="w-3 h-3 fill-current" /></div>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{fontFamily:'Manrope,sans-serif'}}>thedoggycompany</h2>
              <p className="text-xs text-pink-300/70 tracking-wider">PET CONCIERGE®</p>
            </div>
          </div>
          <div className="max-w-md">
            <p className="text-sm text-amber-300/70 mb-2 tracking-wide font-medium">In loving memory of</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{fontFamily:'Manrope,sans-serif'}}>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Kouros</span>
              <span className="text-pink-400 mx-2">&</span>
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">Mystique</span>
            </h1>
            <p className="text-base text-slate-300 leading-relaxed italic">"They taught us that to know a pet is to know a soul."</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile portrait + memorial */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="relative mb-4 flex items-center gap-2">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400/30 to-orange-500/30 rounded-full blur-lg opacity-60" />
                <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-xl shadow-amber-500/30 ring-2 ring-amber-500/30">
                  <img src={KOUROS_IMAGE} alt="Kouros" className="w-full h-full object-cover transform scale-110" />
                </div>
              </div>
              <Heart className="w-4 h-4 text-pink-400 fill-current animate-pulse" />
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-tr from-pink-500/30 to-purple-500/30 rounded-full blur-lg opacity-60" />
                <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-xl shadow-purple-500/30 ring-2 ring-purple-500/30">
                  <img src={MYSTIQUE_IMAGE} alt="Mystique" className="w-full h-full object-cover transform scale-110" />
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-300/70 mb-1">In loving memory of</p>
            <h2 className="text-xl font-bold mb-2" style={{fontFamily:'Manrope,sans-serif'}}>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Kouros</span>
              <span className="text-pink-400 mx-1">&</span>
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Mystique</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white" style={{fontFamily:'Manrope,sans-serif'}}>thedoggycompany</h2>
                <p className="text-[10px] text-pink-300/70 tracking-wider">PET CONCIERGE®</p>
              </div>
            </div>
          </div>

          {/* Welcome */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" style={{fontFamily:'Manrope,sans-serif'}}>Join the Pack</h1>
            <p className="text-slate-400">Create your account and meet Mira</p>
          </div>

          {/* Form Card */}
          <div className="backdrop-blur-xl bg-slate-900/60 rounded-2xl shadow-2xl border border-white/10 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
                    placeholder="Pet Parent Name"
                    required
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
                    placeholder="you@example.com"
                    required
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
                    placeholder="+91 98765 43210"
                    required
                    data-testid="register-phone-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
                    placeholder="••••••••"
                    required
                    data-testid="register-password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold rounded-full shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                disabled={loading}
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-pink-400 font-semibold hover:text-pink-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
