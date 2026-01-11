import { useState } from 'react';

import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

export function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('admin@stanford.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [registrationMode, setRegistrationMode] = useState<'institutional' | 'user'>('user'); // Default to user (student/instructor) check
  const [institutionalKey, setInstitutionalKey] = useState('');



  // ... existing state ...

  // Reset form when toggling mode
  const toggleRegistrationMode = (mode: 'institutional' | 'user') => {
    setRegistrationMode(mode);
    setError(null);
    setName('');
    setInstitutionalKey('');
    // Keep email/pass if user wants
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      if (isSignUp) {
        // Registration for invited users
        console.log('Attempting registration with:', email);
        const result = await api.register(email, password, name);
        console.log('Registration response:', result);

        if (result.success) {
          // Registration successful - now login
          showToast(`Registration successful! You are registered as ${result.role}. Please login.`, 'success');
          setIsSignUp(false); // Switch to login mode
          setName('');
        } else {
          throw new Error(result.error || 'Registration failed');
        }
      } else {
        // Sign In
        console.log('Attempting login with:', email);
        const profile = await api.login(email, password);
        console.log('Login response:', profile);
        if (profile) {
          // Success! App.tsx will handle the redirect because the token is in localStorage 
          // and we should probably force a reload or call a callback.
          window.location.reload();
        } else {
          throw new Error("Login failed. Please check your credentials.");
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);

      let errorMessage = 'An unexpected error occurred';
      let debugMsg = '';

      if (err.response) {
        // Server responded with a status code outside of 2xx Range
        const data = err.response.data;
        const status = err.response.status;

        debugMsg = `Status: ${status}, URL: ${err.config?.url}`;

        if (status === 401) {
          errorMessage = data.detail || 'Invalid email or password. Please try again.';
        } else if (status === 400) {
          if (data.error && data.error.includes('already registered')) {
            errorMessage = 'Duplicate Login: This email is already registered. Please sign in instead.';
          } else if (data.non_field_errors) {
            errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else {
            // Check if any field specific errors
            const firstField = Object.keys(data)[0];
            if (firstField && firstField !== 'error') {
              const fieldError = Array.isArray(data[firstField]) ? data[firstField][0] : data[firstField];
              errorMessage = `${firstField.charAt(0).toUpperCase() + firstField.slice(1)}: ${fieldError}`;
            } else {
              errorMessage = data.error || 'Invalid request data.';
            }
          }
        } else if (status === 403) {
          errorMessage = data.detail || 'You do not have permission to perform this action.';
        } else if (status === 404) {
          errorMessage = 'Resource not found. Please check your connection or contact support.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data.detail || data.error || 'An error occurred during authentication.';
        }

      } else if (err.request) {
        // Request was made but no response was received
        errorMessage = 'Network Error. Please check your internet connection and try again. Ensure the backend server is running.';
        console.error('No response received:', err.request);
      } else {
        // Something happened in setting up the request
        errorMessage = err.message || 'Error initializing login request.';
      }

      setError(errorMessage);
      if (debugMsg) setDebugInfo(debugMsg);

    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
            <div className="flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Mediatlas" className="w-20 h-20 rounded-2xl shadow-lg object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent mb-2">Mediatlas</h1>
            <p className="text-slate-600">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </p>
          </div>

          {/* Registration Mode Toggles */}
          {isSignUp && (
            <div className="px-8 pt-4">
              <div className="bg-slate-100 p-1 rounded-lg flex">
                <button
                  type="button"
                  onClick={() => toggleRegistrationMode('user')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${registrationMode === 'user' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Student / Faculty
                </button>
                <button
                  type="button"
                  onClick={() => toggleRegistrationMode('institutional')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${registrationMode === 'institutional' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Institution
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="px-8 py-6 space-y-4">

            {isSignUp && registrationMode === 'institutional' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4 flex gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Institutional Representatives require a secret key to register.</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Representative Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2 font-medium">Institutional Secret Key</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={institutionalKey}
                      onChange={(e) => setInstitutionalKey(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                      placeholder="Enter secret key"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {isSignUp && registrationMode === 'user' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 mb-4">
                <p>Please use the email address your administrator successfully invited you with.</p>
              </div>
            )}

            {isSignUp && registrationMode === 'user' && (
              <div>
                <label className="block text-sm text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-700 mb-2">Email or Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="admin or name@medical.edu"
                  required
                />
              </div>
            </div>


            <div>
              <label className="block text-sm text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex flex-col gap-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">Login Failed</p>
                </div>
                <p className="text-xs text-red-600 pl-7">{error}</p>
                {debugInfo && <p className="text-[10px] text-red-400 pl-7 font-mono">{debugInfo}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Processing...' : isSignUp ? 'Verify & Register' : 'Sign In'}
            </button>
          </form>

          <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

