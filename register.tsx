
import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { DISCORD_INVITE_CODE } from './constants';
import { Server, ShieldCheck, AlertCircle, ArrowRight, User as UserIcon, Lock, Key as KeyIcon } from 'lucide-react';

const RegisterPortal: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Alinhamento exato com App.tsx para semente de chave horária
  const currentHourlyKey = useMemo(() => {
    const now = new Date();
    const seed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    return "KEY-" + Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
  }, [new Date().getHours()]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputKey = key.toUpperCase().trim();
    const isValidKey = inputKey === DISCORD_INVITE_CODE || inputKey === currentHourlyKey;
    
    if (!isValidKey) {
      setError("CHAVE INVÁLIDA OU EXPIRADA. SOLICITE UMA NOVA NO PORTAL PRINCIPAL.");
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('essaygen_users') || '{}');
      
      // Bloqueio de Nome Duplicado na tela de registro isolada
      const usernameLower = name.trim().toLowerCase();
      const userExists = Object.values(users).some((u: any) => u.username.toLowerCase() === usernameLower);
      
      if (userExists || users[usernameLower]) {
        setError("ESTE NOME DE USUÁRIO JÁ ESTÁ SENDO USADO. MUDE O NOME.");
        return;
      }

      const emailKey = usernameLower + "@manual.reg"; // Placeholder email
      users[emailKey] = { username: name.trim(), password, email: emailKey, createdAt: Date.now() };
      localStorage.setItem('essaygen_users', JSON.stringify(users));
      setSuccess(true);
    } catch (e) {
      setError("FALHA AO ACESSAR BANCO DE DADOS LOCAL.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-cyan-500/50 p-12 rounded-[3rem] text-center space-y-6 shadow-2xl animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-cyan-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">CONTA ATIVA</h2>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest leading-relaxed">
            Sua credencial foi registrada com sucesso no sistema local.
          </p>
          <button onClick={() => window.location.href = './index.html'} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase text-xs tracking-widest transition-all">IR PARA LOGIN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <Server className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white uppercase italic">Criar Conta</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Sincronização v3.8.0</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-[10px] font-black flex items-center gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 focus:border-cyan-500 outline-none transition-all font-bold text-sm"
                placeholder="Ex: joao_25"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 focus:border-cyan-500 outline-none transition-all font-bold text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest ml-1 italic">Chave de Ativação (Gerada no App)</label>
            <div className="relative">
              <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-700" />
              <input 
                type="text" required value={key} onChange={(e) => setKey(e.target.value)}
                className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded-2xl py-4 pl-12 pr-6 focus:border-cyan-500 outline-none transition-all font-mono font-black text-cyan-400 text-sm"
                placeholder="KEY-XXXXXX"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-cyan-600/20 uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 group">
            FINALIZAR REGISTRO <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
