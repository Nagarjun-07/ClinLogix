import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { UserRole } from '../App';

export function LoginPage() {
  const [email, setEmail] = useState('sarah.johnson@medical.edu');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [registrationMode, setRegistrationMode] = useState<'institutional' | 'user'>('user'); // Default to user (student/instructor) check
  const [institutionalKey, setInstitutionalKey] = useState('');
  const [institutionName, setInstitutionName] = useState('');

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

    try {
      if (isSignUp) {
        let roleToAssign: UserRole = 'student'; // Default

        if (registrationMode === 'institutional') {
          // Validate Institutional Key
          if (institutionalKey !== 'health@123') {
            throw new Error('Invalid Institutional Key. Only authorized representatives can register.');
          }
          roleToAssign = 'admin';
        } else {
          // Verify Logic for Student/Instructor
          // Check if email is in authorized_users table
          const invite = await api.checkInvite(email);
          if (!invite) {
            throw new Error('Email not authorized. Please contact your institution administrator to receive an invite.');
          }
          roleToAssign = invite.role as UserRole;
        }

        // Sign Up
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || (registrationMode === 'user' ? (await api.checkInvite(email))?.full_name : ''),
              role: roleToAssign,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Setup initial profile manually if needed
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            email: email,
            full_name: name || (registrationMode === 'user' ? (await api.checkInvite(email))?.full_name : name),
            role: roleToAssign
          }]);
          if (profileError) {
            console.error('Profile creation warning:', profileError);
          }
        }

        // Auto-login check: If email confirmation is disabled in Supabase, session will be present.
        if (data.session) {
          // Session exists, let the onAuthStateChange listener in App.tsx handle the redirect.
        } else {
          // Fallback
          alert('Registration detailed stored. Please check your email/invite status.');
          setIsSignUp(false);
        }
      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes("Email not confirmed")) {
            throw new Error("Please confirm your email address before logging in. Check your inbox.");
          }
          throw signInError;
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
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
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl shadow-lg">
                <GraduationCap className="w-9 h-9 text-white" />
              </div>
            </div>
            <h1 className="text-slate-900 mb-1">Clinical Logbook</h1>
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
              <label className="block text-sm text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="name@medical.edu"
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
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
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

