/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Store, 
  Workflow, 
  CheckCircle2, 
  TrendingUp, 
  ChevronRight,
  UserPlus,
  LogIn
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthLayoutProps {
  onAuthenticate: (user: UserProfile) => void;
}

export default function AuthLayout({ onAuthenticate }: AuthLayoutProps) {
  const [isLoginView, setIsLoginView] = useState(false);
  
  // Signup Form State
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessType, setBusinessType] = useState('Kirana Shop');

  // Input Error states
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Handle Register
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required! (Poora naam likhna zaroori hai)";
    }
    if (!shopName.trim()) {
      errors.shopName = "Store / Business Name is required! (Dukaan ka naam likhna zaroori hai)";
    }
    if (!emailOrMobile.trim()) {
      errors.emailOrMobile = "Email / Mobile identifier is required! (Email ya Mobile number zaroori hai)";
    }
    if (!password.trim()) {
      errors.password = "Secure Password is required! (Password likhna zaroori hai)";
    } else if (password.trim().length < 6) {
      errors.password = "Password must be at least 6 characters. (Password kam se kam 6 char ka hona chahiye)";
    }
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Verify password is required! (Password confirm karna zaroori hai)";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match! (Dono passwords aapas mein mel nahi kha rahe hain)";
    }

    if (Object.keys(errors).length > 0) {
      setSignupErrors(errors);
      return;
    }

    setSignupErrors({});

    const newUser: UserProfile = {
      fullName: fullName.trim(),
      shopName: shopName.trim(),
      emailOrMobile: emailOrMobile.trim(),
      businessType: businessType,
      isFresh: true // Registered custom merchants start from absolute 0 state
    };

    // Save registered user list to localStorage so they can log back in later
    try {
      const existingStr = localStorage.getItem('vyapaar_registered_users') || '[]';
      const existing = JSON.parse(existingStr);
      // Remove duplicate if same identifier
      const filtered = Array.isArray(existing) ? existing.filter((u: any) => u.emailOrMobile.toLowerCase() !== emailOrMobile.trim().toLowerCase()) : [];
      filtered.push({
        fullName: fullName.trim(),
        shopName: shopName.trim(),
        emailOrMobile: emailOrMobile.trim(),
        businessType: businessType,
        password: password.trim()
      });
      localStorage.setItem('vyapaar_registered_users', JSON.stringify(filtered));
    } catch (err) {
      console.error("Local storage sync error", err);
    }

    onAuthenticate(newUser);
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!loginIdentifier.trim()) {
      errors.loginIdentifier = "Email / Mobile is required! (Email ya Mobile darj karein)";
    }
    if (!loginPassword.trim()) {
      errors.loginPassword = "Password is required! (Password darj karein)";
    }

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setLoginErrors({});

    // Try to recover any previously registered user details to verify the custom business name
    let foundProfile: UserProfile | null = null;
    try {
      const savedUsersStr = localStorage.getItem('vyapaar_registered_users');
      if (savedUsersStr) {
        const parsedList = JSON.parse(savedUsersStr);
        if (Array.isArray(parsedList)) {
          // Check if the user exists first but password is wrong to show specific password error
          const userWithSameId = parsedList.find(
            (u: any) => 
              u.emailOrMobile.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
              u.fullName.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
              u.shopName.toLowerCase() === loginIdentifier.trim().toLowerCase()
          );

          if (userWithSameId && userWithSameId.password !== loginPassword.trim()) {
            setLoginErrors({
              loginPassword: "Wrong password! (Aapka password galat hai)"
            });
            return;
          }

          const match = parsedList.find(
            (u: any) => 
              (u.emailOrMobile.toLowerCase() === loginIdentifier.trim().toLowerCase() || 
               u.fullName.toLowerCase() === loginIdentifier.trim().toLowerCase() || 
               u.shopName.toLowerCase() === loginIdentifier.trim().toLowerCase()) &&
              u.password === loginPassword.trim()
          );
          if (match) {
            foundProfile = {
              fullName: match.fullName,
              shopName: match.shopName,
              emailOrMobile: match.emailOrMobile,
              businessType: match.businessType,
              isFresh: false // Preserve their existing registered user database (do not wipe to 0 again)
            };
          }
        }
      }
    } catch (err) {}

    if (foundProfile) {
      onAuthenticate(foundProfile);
    } else {
      // Create a brand new dynamic merchant profile starting from 0 using their custom input!
      // This means they are never stuck with Saraswati if they login with a random test identifier!
      const emailPart = loginIdentifier.trim().split('@')[0];
      const cleanName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
      
      const customFallbackUser: UserProfile = {
        fullName: cleanName,
        shopName: `${cleanName} & Sons General Store`,
        emailOrMobile: loginIdentifier.trim(),
        businessType: "Kirana Shop & general products",
        isFresh: true // Fresh login starts from absolute 0!
      };
      
      // Save it as a registered user also so they can reload it
      try {
        const existingStr = localStorage.getItem('vyapaar_registered_users') || '[]';
        const existing = JSON.parse(existingStr);
        const filtered = Array.isArray(existing) ? existing.filter((u: any) => u.emailOrMobile.toLowerCase() !== loginIdentifier.trim().toLowerCase()) : [];
        filtered.push({
          fullName: customFallbackUser.fullName,
          shopName: customFallbackUser.shopName,
          emailOrMobile: customFallbackUser.emailOrMobile,
          businessType: customFallbackUser.businessType,
          password: loginPassword.trim()
        });
        localStorage.setItem('vyapaar_registered_users', JSON.stringify(filtered));
      } catch (e) {}

      onAuthenticate(customFallbackUser);
    }
  };

  // Bypass Quick Demo Login for tester/employer review
  const handleDemoBypass = () => {
    const demoUser: UserProfile = {
      fullName: "Suresh Chandra",
      shopName: "Saraswati Kirana & General Store",
      emailOrMobile: "demo@vyapaar.co",
      businessType: "Kirana Shop & General Stores",
      isFresh: false // Demo shop uses preloaded seed datasets
    };
    onAuthenticate(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background visual blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 select-none pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-20 select-none pointer-events-none"></div>

      {/* Main split component frame */}
      <div className="bg-white rounded-3xl shadow-2xl flex max-w-5xl w-full overflow-hidden border border-slate-100 min-h-[580px] z-10 animate-in fade-in zoom-in duration-300">
        
        {/* LEFT PANEL: Branding & SaaS Showcase */}
        <div className="hidden lg:flex w-1/2 bg-slate-950 text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern background & ambient chromatic highlights */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none" style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none select-none"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none select-none"></div>

          <div className="relative z-10 space-y-4 font-sans">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Building2 size={22} className="transform -rotate-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-widest uppercase font-mono bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Vyapaar
                </span>
                <span className="text-[10px] block text-indigo-400 font-bold uppercase tracking-wider font-mono">
                  SaaS Business Assistant
                </span>
              </div>
            </div>

            <div className="pt-8 space-y-2">
              <h1 className="text-2xl font-black leading-tight tracking-tight text-white mb-2">
                Dhandha Aapka, <br />
                Buddhi Humari. <span className="text-indigo-400 animate-pulse">✨</span>
              </h1>
              <p className="text-slate-400 text-xs leading-normal">
                Upgrade your small store to auto-pilot. Track client credits, print GST invoices, analyze stocks and let our intelligent Gemini AI handle overdue receivables loops automatically.
              </p>
            </div>
          </div>

          {/* Core dynamic feature highlights */}
          <div className="relative z-10 space-y-3.5 my-8">
            {[
              { title: "GST-Compliant Instant Terminal", desc: "Calculate SGST/CGST instantly and print clean receipts." },
              { title: "Smart Baki Khata (Udhaar Book)", desc: "Maintain accounts and get direct WhatsApp collection links." },
              { title: "AI Business Assistant (Buddy)", desc: "Intelligent analytics and smart localized Hindustani insights." }
            ].map((f, idx) => (
              <div key={idx} className="flex gap-3 text-xs bg-slate-900/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-800/50">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-white">{f.title}</h4>
                  <p className="text-slate-400 leading-normal">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 justify-between select-none">
            <span>Jaipur, RJ • ISO 27001 Secure</span>
            <span>v2.4 Production Suite</span>
          </div>
        </div>

        {/* RIGHT PANEL: Auth Interactive Form toggling */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-between min-h-[500px]">
          {/* Header */}
          <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-full self-end text-[11px] font-bold shadow-2xs">
            <button
              onClick={() => setIsLoginView(true)}
              className={`px-4 py-1.5 rounded-full transition-all ${isLoginView ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginView(false)}
              className={`px-4 py-1.5 rounded-full transition-all ${!isLoginView ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          <div className="my-auto py-4 space-y-6">
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-800 flex items-center gap-1.5 leading-tight">
                {isLoginView ? (
                  <>
                    <LogIn className="text-indigo-600" size={20} />
                    Welcome Back to Vyapaar
                  </>
                ) : (
                  <>
                    <UserPlus className="text-indigo-600" size={20} />
                    Create Retail Merchant Account
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isLoginView 
                  ? "Access your store ledger, safe books and inventory lists immediately."
                  : "Begin your digital ledger bookkeeping journey. No credit card required."}
              </p>
            </div>

            {/* --- VIEW 1: SIGN IN VIEW --- */}
            {isLoginView ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email / Mobile Number *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Mail size={15} />
                    </span>
                    <input 
                      type="text" 
                      required
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        if (loginErrors.loginIdentifier) {
                          setLoginErrors(prev => {
                            const { loginIdentifier: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      placeholder="e.g. jaipur_merchant@gmail.com" 
                      className={`w-full text-xs border ${loginErrors.loginIdentifier ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-indigo-500'} rounded-xl py-3 pl-10 pr-4 focus:outline-hidden font-medium text-slate-700 bg-white`}
                    />
                  </div>
                  {loginErrors.loginIdentifier && (
                    <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <span>⚠️</span> {loginErrors.loginIdentifier}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Account Password *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Lock size={15} />
                    </span>
                    <input 
                      type="password" 
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrors.loginPassword) {
                          setLoginErrors(prev => {
                            const { loginPassword: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      placeholder="••••••••" 
                      className={`w-full text-xs border ${loginErrors.loginPassword ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-indigo-500'} rounded-xl py-3 pl-10 pr-4 focus:outline-hidden font-medium text-slate-700 bg-white`}
                    />
                  </div>
                  {loginErrors.loginPassword && (
                    <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <span>⚠️</span> {loginErrors.loginPassword}
                    </p>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs transition-colors shadow-xs hover:shadow-md flex items-center justify-center gap-1 mt-6 cursor-pointer"
                >
                  <LogIn size={14} />
                  Access Store Dashboard
                </button>

                <div className="text-center mt-4">
                  <p className="text-xs text-slate-500">
                    New store owner?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginView(false);
                        setSignupErrors({});
                        setLoginErrors({});
                      }}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer focus:outline-hidden"
                    >
                      Create / Register a new merchant here (Start from 0!)
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* --- VIEW 2: SIGN UP REGISTRATION VIEW --- */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">
                        <User size={14} />
                      </span>
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (signupErrors.fullName) {
                            setSignupErrors(prev => {
                              const { fullName: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        placeholder="Ramesh Gupta" 
                        className={`w-full text-xs border ${signupErrors.fullName ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-indigo-500'} rounded-xl py-2.5 pl-9 pr-3 focus:outline-hidden font-medium text-slate-700 bg-white`}
                      />
                    </div>
                    {signupErrors.fullName && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <span>⚠️</span> {signupErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Store / Business Name *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">
                        <Store size={14} />
                      </span>
                      <input 
                        type="text" 
                        required
                        value={shopName}
                        onChange={(e) => {
                          setShopName(e.target.value);
                          if (signupErrors.shopName) {
                            setSignupErrors(prev => {
                              const { shopName: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        placeholder="Gupta Kirana Store" 
                        className={`w-full text-xs border ${signupErrors.shopName ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-indigo-500'} rounded-xl py-2.5 pl-9 pr-3 focus:outline-hidden font-medium text-slate-700 bg-white`}
                      />
                    </div>
                    {signupErrors.shopName && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <span>⚠️</span> {signupErrors.shopName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email / Mobile identifier *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Mail size={14} />
                    </span>
                    <input 
                      type="text" 
                      required
                      value={emailOrMobile}
                      onChange={(e) => {
                        setEmailOrMobile(e.target.value);
                        if (signupErrors.emailOrMobile) {
                          setSignupErrors(prev => {
                            const { emailOrMobile: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      placeholder="e.g. 9414000000 or merchant@vyapaar.co" 
                      className={`w-full text-xs border ${signupErrors.emailOrMobile ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-indigo-500'} rounded-xl py-2.5 pl-9 pr-3 focus:outline-hidden font-medium text-slate-700 bg-white`}
                    />
                  </div>
                  {signupErrors.emailOrMobile && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <span>⚠️</span> {signupErrors.emailOrMobile}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Secure Password *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">
                        <Lock size={14} />
                      </span>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (signupErrors.password) {
                            setSignupErrors(prev => {
                              const { password: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        placeholder="At least 6 characters" 
                        className={`w-full text-xs border ${signupErrors.password ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-indigo-500'} rounded-xl py-2.5 pl-9 pr-3 focus:outline-hidden font-medium text-slate-700 bg-white`}
                      />
                    </div>
                    {signupErrors.password && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <span>⚠️</span> {signupErrors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confirm Password *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">
                        <Lock size={14} className={signupErrors.confirmPassword ? "text-red-500" : "text-indigo-500"} />
                      </span>
                      <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (signupErrors.confirmPassword) {
                            setSignupErrors(prev => {
                              const { confirmPassword: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        placeholder="Re-enter password" 
                        className={`w-full text-xs border ${signupErrors.confirmPassword ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:border-indigo-500'} rounded-xl py-2.5 pl-9 pr-3 focus:outline-hidden font-medium text-slate-700 bg-white`}
                      />
                    </div>
                    {signupErrors.confirmPassword && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <span>⚠️</span> {signupErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Type / Category *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="Kirana Shop">Kirana & General Provision Stores</option>
                    <option value="Electronics Retail">Electronics & Appliances Retailer</option>
                    <option value="Wholesaler">Wholesaler & Bulk FMCG Distributor</option>
                    <option value="Boutique & Apparel">Fashion Boutique & Textile Retail</option>
                    <option value="Medical Pharmacy">Medical Store & Chemists</option>
                    <option value="Other Stores">Other Retail Stores & Service providers</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-behaviors shadow-xs hover:shadow-md flex items-center justify-center gap-1 mt-4 cursor-pointer"
                >
                  <UserPlus size={14} />
                  Register & Boot Shop Ledger
                </button>

                <div className="text-center mt-3">
                  <p className="text-xs text-slate-500">
                    Already registered or have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginView(true);
                        setSignupErrors({});
                        setLoginErrors({});
                      }}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer focus:outline-hidden"
                    >
                      Sign In to your existing store account here
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Quick Portfolio Settle/Review bypass */}
          <div className="space-y-3.5 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-350 uppercase select-none font-mono">Portfolio Showcase tools:</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-ping"></span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button 
                onClick={handleDemoBypass}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 border border-indigo-100"
              >
                <Sparkles size={13} className="text-indigo-600" />
                Demo (Saraswati Seed Store)
              </button>
              <div className="text-[10px] text-slate-400 leading-normal hidden sm:block flex items-center">
                Explore custom analytics with a simulated sample dataset, or register above with your custom business name to start from absolute 0 database values!
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
