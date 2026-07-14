/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin ? { email, password } : { email, password, name };
      const response = await axios.post(endpoint, payload);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      onAuthSuccess(response.data.user);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 transition-colors" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-700 dark:bg-indigo-950/40 rounded-full blur-3xl opacity-50 transition-colors" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-8 relative z-10 transition-colors"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-100 dark:shadow-none">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isLogin ? 'Welcome back' : 'Join us today'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your expenses with style.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white transition-colors"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white transition-colors"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100 dark:shadow-none mt-4 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
            {!isLoading && <ArrowRight size={20} className="ml-2" />}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
