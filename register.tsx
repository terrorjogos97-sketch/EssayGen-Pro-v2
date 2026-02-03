
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DISCORD_INVITE_CODE } from './constants';
import { Server, ShieldCheck, AlertCircle, ArrowRight, User as UserIcon, Lock, Key as KeyIcon } from 'lucide-react';

// --- VALIDADOR DE CHAVE UNIVERSAL (Sincronizado com App.tsx) ---
const validateUniversalKey = (key: string): boolean => {
  const cleanKey = key.toUpperCase().trim();
  if (cleanKey === DISCORD_INVITE_CODE) return true;
  if (!cleanKey.startsWith("KEY-") || cleanKey.length !== 10) return false;
  
  const payload = cleanKey.substring(4);
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    sum += payload.charCodeAt(i);
  }
  // Algoritmo persistente: soma % 13 deve ser 7
  return sum % 13 === 7;
};

const RegisterPortal: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateUniversalKey(key)) {
      setError("CHAVE INVÁLIDA OU NÃO AUTORIZADA PELO ALGORITMO.");
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('essaygen_users') || '{}');
      const usernameLower = name.trim().toLowerCase();
      
      if (Object.values(users).some((u: any) => u.username.toLowerCase() === usernameLower)) {
        setError("ESTE NOME DE USUÁRIO JÁ ESTÁ SENDO USADO.");
        return;
      }

      const emailKey = usernameLower + "@manual.reg";
      users[emailKey] = { username: name.trim(), password, email: emailKey, createdAt: Date.now() };
      localStorage.setItem('essaygen_users', JSON.stringify(users));
      setSuccess(true);
    } catch (e) {
      setError("FALHA AO ACESSAR O BANCO DE DADOS LOCAL.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-cyan-500/50 p-12 rounded-[3rem] text-center space-y-6 shadow-2xl animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-cyan-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">CONTA ATIVA</h2>
          <button onClick={() => window.location.href = './index.html'} className="w-full bg-cyan-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase text-xs tracking-widest">IR PARA LOGIN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in duration-500">
        <div className="text-center">
          <Server className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Portal de Ativação</h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest italic mt-2">v4.3.0 Algorithmic Auth</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-[10px] font-black flex items-center gap-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Usuário</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 focus:border-cyan-500 outline-none font-bold text-sm" placeholder="Nome de usuário" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 focus:border-cyan-500 outline-none font-bold text-sm" placeholder="••••••••" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-cyan-500 uppercase ml-1 italic tracking-widest">Chave Mestre Universal</label>
            <div className="relative">
              <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-700" />
              <input type="text" required value={key} onChange={(e) => setKey(e.target.value)} className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded-2xl py-4 pl-12 pr-6 focus:border-cyan-500 outline-none font-mono font-black text-cyan-400 text-sm" placeholder="KEY-XXXXXX" />
            </div>
          </div>

          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 group transition-none">
            SINCRONIZAR <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('register-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RegisterPortal />);
}
