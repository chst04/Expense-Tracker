/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Filter,
  PieChart as PieChartIcon,
  CloudUpload,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  parseISO
} from 'date-fns';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Transaction, TransactionType, CATEGORIES, CURRENCIES } from './types';
import { Auth } from './components/Auth';
import { initDB, addTransactionDB, getTransactionsDB, deleteTransactionDB } from './services/db';

// Icons mapping helper
import * as Icons from 'lucide-react';

const IconRenderer = ({ name, color }: { name: string, color?: string }) => {
  const LucideIcon = (Icons as any)[name] || Icons.HelpCircle;
  return <LucideIcon size={18} style={{ color }} />;
};

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('auth-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('app-currency');
    return saved ? JSON.parse(saved) : CURRENCIES[0];
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('app-dark-mode');
    return saved === 'true';
  });
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'budget'>('home');
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem('app-monthly-budget');
    return saved ? parseFloat(saved) : 2000;
  });
  
  useEffect(() => {
    localStorage.setItem('app-monthly-budget', monthlyBudget.toString());
  }, [monthlyBudget]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    setTransactionDate(format(currentDate, 'yyyy-MM-dd'));
  }, [currentDate]);

  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('app-currency', JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('app-dark-mode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // SQLite Persistence & Initial Load
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          await initDB();
          const data = await getTransactionsDB(user.id);
          // Sort all transactions by date descending
          setTransactions(data.sort((a: any, b: any) => b.date.localeCompare(a.date)));
        } catch (e) {
          console.error("DB Init Error", e);
          toast.error("Database initialization failed");
        }
      };
      loadData();
    }
  }, [user]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const currentMonthTransactions = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start, end });
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentDate]);

  const stats = useMemo(() => {
    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
      
    // Previous month stats for simple comparison
    const prevMonth = subMonths(currentDate, 1);
    const startPrev = startOfMonth(prevMonth);
    const endPrev = endOfMonth(prevMonth);
    const prevTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: startPrev, end: endPrev });
    });
    
    const prevExpenses = prevTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenseTrend = prevExpenses > 0 
      ? ((expenses - prevExpenses) / prevExpenses) * 100 
      : 0;

    return { income, expenses, balance: income - expenses, expenseTrend, prevExpenses };
  }, [currentMonthTransactions, transactions, currentDate]);

  const chartData = useMemo(() => {
    const expenseData = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const cat = CATEGORIES.find(c => c.id === t.category);
        const name = cat?.name || 'Other';
        if (!acc[name]) acc[name] = { name, value: 0, color: cat?.color || '#94a3b8' };
        acc[name].value += t.amount;
        return acc;
      }, {} as Record<string, { name: string, value: number, color: string }>);

    return Object.values(expenseData);
  }, [currentMonthTransactions]);

  const handleAddTransaction = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      type,
      category,
      description: description || CATEGORIES.find(c => c.id === category)?.name || 'Transaction',
      date: new Date(transactionDate).toISOString(),
    };

    try {
      await addTransactionDB(newTransaction, user.id);
      setTransactions([newTransaction, ...transactions]);
      setIsOpen(false);
      resetForm();
      toast.success('Transaction saved to SQLite');
    } catch (e) {
      toast.error("Failed to save transaction");
    }
  };

  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await axios.post('/api/sync', { userId: user.id, transactions });
      toast.success('Synced to Cloud');
    } catch (e) {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
    toast.info('Logged out');
  };

  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategory('other');
    setDescription('');
    setTransactionDate(format(currentDate, 'yyyy-MM-dd'));
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteTransactionDB(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Removed from database');
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <Auth onAuthSuccess={(u) => {
          setUser(u);
          localStorage.setItem('auth-user', JSON.stringify(u));
        }} />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 font-sans p-0 sm:p-4 md:p-8 flex items-center justify-center transition-colors duration-300`}>
      <Toaster position="top-center" richColors />
      
      <main className="w-full max-w-md bg-white dark:bg-slate-900 sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative sm:border-[12px] sm:border-slate-900 h-screen sm:h-[800px] transition-colors">
        {/* Device Notch */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50"></div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
          {showProfile ? (
            <motion.div
              key="profile"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col"
            >
              <div className="bg-indigo-600 p-8 pt-12 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                  <Icons.User size={120} />
                </div>
                <button 
                  onClick={() => setShowProfile(false)}
                  className="mb-8 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl font-bold">
                    {(user.name || user.email).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.name || 'User'}</h2>
                    <p className="text-indigo-200 text-sm">{user.email}</p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Account Credentials</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Full Name</p>
                        <p className="text-slate-900 dark:text-white font-medium">{user.name || 'Not provided'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Email Address</p>
                        <p className="text-slate-900 dark:text-white font-medium">{user.email}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">User ID</p>
                        <p className="text-slate-900 dark:text-white font-mono text-[10px]">{user.id}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Preferences</h3>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                          {isDarkMode ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-bold text-sm">Dark Mode</p>
                          <p className="text-slate-400 text-[10px] font-medium">Toggle app theme</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </section>

                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-rose-100 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold"
                    onClick={handleLogout}
                  >
                    Logout Account
                  </Button>
                </div>
              </ScrollArea>
              
              <div className="p-6 pt-0">
                <p className="text-center text-[10px] text-slate-300 font-medium uppercase tracking-[0.2em]">Version 1.0.4 • Build 2026.04</p>
              </div>
            </motion.div>
          ) : activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Indigo Header Section */}
              <header className="pt-12 px-6 pb-8 bg-indigo-600 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Wallet size={120} />
          </div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xs font-bold hover:bg-white/30 transition-all active:scale-95"
              >
                {(user.name || user.email).substring(0, 2).toUpperCase()}
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={prevMonth}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest min-w-[80px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                  </p>
                  <button 
                    onClick={nextMonth}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <h1 className="text-xl font-bold truncate max-w-[120px]">Hi, {user.name || user.email.split('@')[0]}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Select value={currency.code} onValueChange={(code) => setCurrency(CURRENCIES.find(c => c.code === code) || CURRENCIES[0])}>
                <SelectTrigger className="h-9 w-20 bg-white/10 border-white/10 text-indigo-100 rounded-xl px-2 text-[10px] font-bold uppercase focus:ring-0 focus:ring-offset-0 transition-colors hover:bg-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code} className="rounded-xl h-10 text-[10px] font-bold uppercase">
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-rose-200 hover:text-white hover:bg-rose-500/20 rounded-xl px-3 h-9 flex items-center gap-2 border border-rose-500/10"
              >
                <LogOut size={14} />
                <span className="text-[10px] font-bold uppercase">Exit</span>
              </Button>
            </div>
          </div>
          
          {/* Glassmorphism Balance Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl relative z-10">
            <p className="text-indigo-100 text-sm mb-1 font-medium">Total Balance</p>
            <h2 className="text-4xl font-bold mb-4">{currency.symbol}{stats.balance.toLocaleString()}</h2>
            
            <div className="flex justify-between items-end gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-indigo-100 mb-2 font-bold uppercase tracking-wider">
                  <span>Usage</span>
                  <span>{stats.expenses > 0 ? Math.min(100, Math.round((stats.expenses / (stats.income || 1)) * 100)) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-indigo-900/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.expenses / (stats.income || 1)) * 100)}%` }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-emerald-400/20 p-2 rounded-xl border border-emerald-400/30 text-emerald-300">
                  <TrendingUp size={16} />
                </div>
                <div className="bg-rose-400/20 p-2 rounded-xl border border-rose-400/30 text-rose-300">
                  <TrendingDown size={16} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-slate-900 rounded-t-[32px] -mt-6 relative z-20 shadow-[-4px_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
          <div className="p-6 space-y-8 pb-32">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-3xl border border-emerald-100/50 dark:border-emerald-500/20">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-100 dark:shadow-none">
                  <ArrowUpRight size={20} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Income</p>
                <p className="text-slate-900 dark:text-emerald-400 font-bold text-lg">{currency.symbol}{stats.income.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-3xl border border-rose-100/50 dark:border-rose-500/20">
                <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg shadow-rose-100 dark:shadow-none">
                  <ArrowDownLeft size={20} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Expenses</p>
                <p className="text-slate-900 dark:text-rose-400 font-bold text-lg">{currency.symbol}{stats.expenses.toLocaleString()}</p>
              </div>
            </div>

            {/* Categories Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Spending</h3>
                <PieChartIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              
              {chartData.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory no-scrollbar">
                  {chartData.map((data, idx) => (
                    <div key={idx} className="flex-none w-16 flex flex-col items-center gap-2 snap-center">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                        style={{ backgroundColor: data.color }}
                      >
                        <IconRenderer name={CATEGORIES.find(c => c.name === data.name)?.icon || 'HelpCircle'} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center truncate w-full">{data.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No data to display this month
                </div>
              )}
            </section>

            {/* History Section */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Transactions</h3>
                <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
                  <DialogTrigger className="text-indigo-600 text-sm font-bold hover:underline underline-offset-4 transition-all">
                    View All
                  </DialogTrigger>
                  <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden sm:max-w-[450px] h-[80vh] flex flex-col">
                    <div className="bg-indigo-600 p-8 text-white shrink-0">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Transaction History</DialogTitle>
                        <CardDescription className="text-indigo-100 italic">Full records from your local storage.</CardDescription>
                      </DialogHeader>
                      <div className="mt-6 relative">
                        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                        <Input 
                          placeholder="Search descriptions or categories..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 h-12 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                        />
                      </div>
                    </div>
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-4">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((t) => {
                            const initialCharge = t.description.substring(0, 2).toUpperCase();
                            return (
                              <div key={t.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                                    {initialCharge}
                                  </div>
                                  <div>
                                    <p className="text-slate-900 dark:text-white font-bold text-sm">{t.description}</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium">
                                      {format(parseISO(t.date), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                    {t.type === 'income' ? '+' : '-'}{currency.symbol}{t.amount.toLocaleString()}
                                  </p>
                                  <button 
                                    onClick={() => deleteTransaction(t.id)}
                                    className="text-[9px] text-rose-500 font-bold hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-20 text-center text-slate-400 dark:text-slate-600 text-sm font-medium">
                            No records found match your search.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {currentMonthTransactions.length > 0 ? (
                    currentMonthTransactions.map((t) => {
                      const cat = CATEGORIES.find(c => c.id === t.category);
                      const initialCharge = t.description.substring(0, 2).toUpperCase();
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group flex items-center justify-between p-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-sm border-2 border-white dark:border-slate-700 shadow-sm transition-colors">
                              {initialCharge}
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold text-sm">{t.description}</p>
                              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                                {format(parseISO(t.date), 'MMM dd, hh:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                              {t.type === 'income' ? '+' : '-'}{currency.symbol}{t.amount.toLocaleString()}
                            </p>
                            <button 
                              onClick={() => deleteTransaction(t.id)}
                              className="text-[10px] text-rose-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter"
                            >
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-600 text-xs italic font-medium">
                      Your financial journey starts here.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    ) : activeTab === 'stats' ? (
      <motion.div
        key="stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900"
      >
        <header className="pt-12 px-6 pb-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis</h2>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
              <Icons.Calendar size={14} className="text-indigo-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{format(currentDate, 'MMM yyyy')}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 bg-white dark:bg-slate-700 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inflow</p>
              <p className="text-xl font-bold text-emerald-500">{currency.symbol}{stats.income.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-700 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Outflow</p>
              <p className="text-xl font-bold text-rose-500">{currency.symbol}{stats.expenses.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          <div className="space-y-8 pb-32">
            <section>
              <h3 className="text-slate-900 dark:text-white font-bold mb-4">Category Breakdown</h3>
              <div className="space-y-5">
                {chartData.sort((a, b) => b.value - a.value).map((data, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: data.color }}>
                          <IconRenderer name={CATEGORIES.find(c => c.name === data.name)?.icon || 'HelpCircle'} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{data.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{currency.symbol}{data.value.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{stats.expenses > 0 ? Math.round((data.value / stats.expenses) * 100) : 0}%</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.expenses > 0 ? (data.value / stats.expenses) * 100 : 0}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <Icons.TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Trend</h4>
                  <p className="text-[10px] text-slate-400 font-medium italic">Compared to {format(subMonths(currentDate, 1), 'MMMM')}</p>
                </div>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${stats.expenseTrend > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {stats.expenseTrend > 0 ? '+' : ''}{Math.round(stats.expenseTrend)}%
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Spending Change</span>
              </div>
              
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {stats.expenseTrend > 0 
                  ? `Oops! You've spent more this month compared to last month. Consider reviewing your top categories.`
                  : `Great job! You're spending less than last month. Keep it up!`}
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="budget"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900"
      >
        <header className="pt-12 px-6 pb-20 bg-indigo-600 text-white relative overflow-hidden shrink-0">
          <div className="absolute bottom-0 right-0 p-8 opacity-10 rotate-45">
            <Icons.Layers size={160} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">Financial Goal</h2>
            <p className="text-indigo-200 text-sm font-medium italic">Track your monthly spending limit</p>
            
            <div className="mt-10 flex flex-col items-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="70" className="stroke-white/10 fill-none" strokeWidth="12" />
                  <motion.circle 
                    cx="80" cy="80" r="70" 
                    className={`fill-none ${stats.expenses > monthlyBudget ? 'stroke-rose-400' : 'stroke-white'}`} 
                    strokeWidth="12" 
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 440" }}
                    animate={{ strokeDasharray: `${Math.min(1, stats.expenses / (monthlyBudget || 1)) * 440} 440` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Used</span>
                  <span className="text-2xl font-bold">{monthlyBudget > 0 ? Math.round((stats.expenses / monthlyBudget) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-t-[40px] -mt-12 relative z-20 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            <div className="space-y-8 pb-32">
              <section className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Limit</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Click to update</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-700 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600">
                    <span className="text-slate-400 font-bold">{currency.symbol}</span>
                    <input 
                      type="number" 
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spent</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{currency.symbol}{stats.expenses.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
                    <p className={`text-lg font-bold ${stats.expenses > monthlyBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {currency.symbol}{Math.abs(monthlyBudget - stats.expenses).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-slate-900 dark:text-white font-bold ml-1">Spending Allowance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20">
                    <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-300 uppercase mb-1">Daily Limit</p>
                    <p className="text-xl font-bold dark:text-indigo-400">{currency.symbol}{(monthlyBudget / 30).toFixed(0)}</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Safe to Spend</p>
                    <p className="text-xl font-bold dark:text-white">{currency.symbol}{Math.max(0, (monthlyBudget - stats.expenses) / Math.max(1, (endOfMonth(currentDate).getDate() - currentDate.getDate()))).toFixed(0)} <span className="text-[10px] text-slate-400">/day</span></p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        {!isOpen && (
          <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 h-20 px-8 flex justify-between items-center shrink-0 transition-colors z-[70]">
            <button 
              onClick={() => { setActiveTab('home'); setShowProfile(false); }}
              className={`flex flex-col items-center transition-all ${activeTab === 'home' && !showProfile ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
            >
              <Icons.Home size={24} />
              <span className="text-[9px] font-bold uppercase mt-1">Home</span>
            </button>
            <button 
              onClick={() => { setActiveTab('stats'); setShowProfile(false); }}
              className={`flex flex-col items-center transition-all ${activeTab === 'stats' && !showProfile ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
            >
              <PieChartIcon size={24} />
              <span className="text-[9px] font-bold uppercase mt-1">Stats</span>
            </button>
            <button 
              onClick={() => { setActiveTab('budget'); setShowProfile(false); }}
              className={`flex flex-col items-center transition-all ${activeTab === 'budget' && !showProfile ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
            >
              <Icons.Layers size={24} />
              <span className="text-[9px] font-bold uppercase mt-1">Budget</span>
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className={`flex flex-col items-center transition-all ${showProfile ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
            >
              <Icons.User size={24} />
              <span className="text-[9px] font-bold uppercase mt-1">Profile</span>
            </button>
          </div>
        )}

  {/* Persistent FAB Integration */}
  {!showProfile && activeTab === 'home' && (
    <div className="absolute bottom-28 right-6 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger
          className="w-14 h-14 rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-4 border-white cursor-pointer"
          id="add-transaction-btn-fixed"
        >
          <Plus size={28} strokeWidth={3} />
        </DialogTrigger>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
          <div className="bg-indigo-600 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Plus size={80} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Entry</DialogTitle>
              <CardDescription className="text-indigo-100">Quickly add a new financial record.</CardDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6 bg-white dark:bg-slate-900 transition-colors">
            <Tabs defaultValue="expense" onValueChange={(v) => setType(v as TransactionType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 h-12">
                <TabsTrigger value="expense" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm font-bold">Expense</TabsTrigger>
                <TabsTrigger value="income" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm font-bold">Income</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4 font-sans">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency.symbol}</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-lg font-bold focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {type === 'expense' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Category</Label>
                  <Select defaultValue="other" onValueChange={setCategory}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium dark:text-white">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-800 dark:text-white">
                      {CATEGORIES.filter(c => c.id !== 'income').map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-xl h-10">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Description</Label>
                <Input 
                  placeholder="e.g. Morning Coffee" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Date</Label>
                <Input 
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium dark:text-white dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={handleAddTransaction} 
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100"
              >
                Save Transaction
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )}
</main>
</div>
);
}
