import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ServiceDesk } from '../components/admin';
import { API_URL } from '../utils/api';
import { 
  LogOut, User, Headphones, Shield, Eye, EyeOff,
  Loader2, AlertCircle
} from 'lucide-react';

/**
 * Agent Portal - Dedicated Service Desk access for non-admin roles
 * Shows only the Service Desk component without full admin access
 */
const AgentPortal = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const [agentInfo, setAgentInfo] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const storedAgent = localStorage.getItem('tdc_agent_session');
      if (storedAgent) {
        try {
          const parsed = JSON.parse(storedAgent);
          if (parsed.username && parsed.expiresAt > Date.now()) {
            setAgentInfo(parsed);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('tdc_agent_session');
          }
        } catch (e) {
          localStorage.removeItem('tdc_agent_session');
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');
    
    try {
      // Try admin login first (agents can be admins too)
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (res.ok) {
        const data = await res.json();
        const agentSession = {
          username: credentials.username,
          name: data.admin?.name || credentials.username,
          role: data.admin?.role || 'agent',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem('tdc_agent_session', JSON.stringify(agentSession));
        setAgentInfo(agentSession);
        setIsAuthenticated(true);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    }
    
    setLoginLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('tdc_agent_session');
    setIsAuthenticated(false);
    setAgentInfo(null);
    setCredentials({ username: '', password: '' });
  };

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Portal</h1>
            <p className="text-gray-500 mt-1">The Doggy Company Service Desk</p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="Enter your username"
                  className="pl-10"
                  required
                  data-testid="agent-username-input"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                  data-testid="agent-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loginLoading}
              data-testid="agent-login-button"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4 mr-2" />
                  Sign In to Service Desk
                </>
              )}
            </Button>
          </form>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-gray-400">
              Need help? Contact your administrator
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Authenticated Agent View - Service Desk Only
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Agent Header */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">Service Desk</h1>
                  <p className="text-xs text-gray-500">The Doggy Company</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-purple-700">
                  {agentInfo?.name || agentInfo?.username}
                </span>
                <Badge variant="outline" className="text-xs">
                  {agentInfo?.role === 'admin' ? 'Admin' : 'Agent'}
                </Badge>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                data-testid="agent-logout-button"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Desk Component */}
      <div className="p-4">
        <ServiceDesk 
          credentials={{ 
            username: agentInfo?.username || credentials.username, 
            password: credentials.password 
          }} 
        />
      </div>
    </div>
  );
};

export default AgentPortal;
