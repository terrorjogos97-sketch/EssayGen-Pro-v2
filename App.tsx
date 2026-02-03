
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppState, User, EssayRequest, StoredUser } from './types';
import { DEV_SECRET_CODE, TERMS_CONTENT, DISCORD_INVITE_CODE } from './constants';
import { 
  Shield, Cpu, Send, PenTool, RefreshCcw, Copy, 
  ArrowLeft, Zap, Users, Trash2, ShieldAlert,
  BarChart3, FileText, Printer, Menu, X, LayoutDashboard, Mail, Circle, Activity,
  Eye, EyeOff, Radio
} from 'lucide-react';

// --- VALIDADOR DE CHAVE UNIVERSAL ---
const validateUniversalKey = (key: string): boolean => {
  const cleanKey = key.toUpperCase().trim();
  if (cleanKey === DISCORD_INVITE_CODE) return true;
  if (!cleanKey.startsWith("KEY-") || cleanKey.length !== 10) return false;
  
  const payload = cleanKey.substring(4);
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    sum += payload.charCodeAt(i);
  }
  return sum % 13 === 7;
};

const generateUniversalKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  while (true) {
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let sum = 0;
    for (let i = 0; i < result.length; i++) {
      sum += result.charCodeAt(i);
    }
    if (sum % 13 === 7) return `KEY-${result}`;
  }
};

const callGemini = async (request: EssayRequest & { isGraphic?: boolean }): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let systemInstruction = `Atue como um redator profissional e acadêmico de elite. `;
    if (request.isGraphic) {
      systemInstruction += `Crie um trabalho escolar completo sobre o tema "${request.topic}". Inclua dados estatísticos e um gráfico ASCII detalhado.`;
    } else {
      systemInstruction += `Escreva um(a) ${request.type} sobre o tema: "${request.topic}". Tom: ${request.tone}. Responda em Português do Brasil com formatação Markdown impecável.`;
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemInstruction,
    });
    return response.text || "Erro na geração.";
  } catch (error) {
    throw new Error("Falha na conexão com a rede neural.");
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeEmails, setActiveEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'essay' | 'school'>('essay');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDevPassword, setShowDevPassword] = useState(false);
  
  const rootPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUser, setSignupUser] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupKey, setSignupKey] = useState('');
  const [devCode, setDevCode] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');

  const startRootPress = () => { rootPressTimer.current = setTimeout(() => setState(AppState.DEV_LOGIN), 3000); };
  const cancelRootPress = () => { if (rootPressTimer.current) clearTimeout(rootPressTimer.current); };

  const startKeyCenterPress = () => { keyPressTimer.current = setTimeout(() => setState(AppState.KEY_CENTER), 10000); };
  const cancelKeyCenterPress = () => { if (keyPressTimer.current) clearTimeout(keyPressTimer.current); };

  // --- SISTEMA DE PRESENÇA V7 (Otimizado) ---
  useEffect(() => {
    const SESSION_KEY = 'essaygen_presence_v7';
    const sessionId = (window as any).sessionId || Math.random().toString(36).substring(2, 9);
    (window as any).sessionId = sessionId;

    const updatePresence = () => {
      const now = Date.now();
      const rawSessions = localStorage.getItem(SESSION_KEY);
      const sessions = rawSessions ? JSON.parse(rawSessions) : {};
      const activeSessions: Record<string, { time: number, email?: string }> = {};
      
      Object.keys(sessions).forEach(id => {
        if (now - sessions[id].time < 20000) {
          activeSessions[id] = sessions[id];
        }
      });
      
      activeSessions[sessionId] = { 
        time: now, 
        email: email ? email.toLowerCase().trim() : undefined 
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(activeSessions));
      
      const uniqueEmails = Array.from(new Set(
        Object.values(activeSessions)
          .map(s => s.email)
          .filter(Boolean) as string[]
      ));
      
      setActiveEmails(uniqueEmails);
      setOnlineCount(Object.keys(activeSessions).length);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        const sessions = JSON.parse(e.newValue || '{}');
        const now = Date.now();
        const validSessions = Object.values(sessions).filter((s: any) => now - s.time < 20000);
        setOnlineCount(validSessions.length || 1);
        setActiveEmails(Array.from(new Set(validSessions.map((s: any) => s.email).filter(Boolean) as string[])));
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 5000);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [email, state]);

  const getAllUsers = (): Record<string, StoredUser> => JSON.parse(localStorage.getItem('essaygen_users') || '{}');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.toLowerCase().trim();
    const users = getAllUsers();
    const userData = users[normalizedEmail];
    if (userData && userData.password === password) {
      setUser({ name: userData.username, isDev: normalizedEmail.includes('admin'), agreedToTerms: false });
      setState(AppState.TERMS);
    } else { setError("E-MAIL OU SENHA INCORRETOS."); }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateUniversalKey(signupKey)) { setError("CHAVE DE ATIVAÇÃO INVÁLIDA."); return; }
    const users = getAllUsers();
    const normalizedEmail = signupEmail.toLowerCase().trim();
    if (users[normalizedEmail]) { setError("E-MAIL JÁ CADASTRADO NO SISTEMA."); return; }
    users[normalizedEmail] = { username: signupUser.trim(), password: signupPassword, email: normalizedEmail, createdAt: Date.now() };
    localStorage.setItem('essaygen_users', JSON.stringify(users));
    setEmail(normalizedEmail);
    setUser({ name: signupUser.trim(), isDev: false, agreedToTerms: false });
    setState(AppState.TERMS);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const text = await callGemini({ topic, type: 'essay', tone: 'formal', wordCount: 500, isGraphic: mode === 'school' });
      setResult(text);
    } catch (e) { setError("ERRO NO MOTOR DE IA."); } finally { setLoading(false); }
  };

  const deleteUser = (targetEmail: string) => {
    if (!confirm(`TEM CERTEZA QUE DESEJA REMOVER ${targetEmail}?`)) return;
    const users = getAllUsers();
    delete users[targetEmail.toLowerCase()];
    localStorage.setItem('essaygen_users', JSON.stringify(users));
    setState(AppState.ADMIN_PANEL);
    alert("Conta removida.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-neural-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[150px] animate-neural-glow delay-2000"></div>
      </div>

      <header className="border-b border-slate-900 p-4 bg-slate-950/80 backdrop-blur-md flex justify-between items-center sticky top-0 z-[110]">
        <div className="flex items-center gap-4">
          {user && (state === AppState.MAIN || state === AppState.ADMIN_PANEL) && (
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 bg-slate-900/50 hover:bg-slate-800 rounded-xl transition-all text-indigo-400 border border-slate-800">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg"><PenTool className="w-5 h-5 text-indigo-500" /></div>
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 uppercase italic tracking-tighter">EssayGen Pro</h1>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
              <Circle size={6} className="fill-green-500 text-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-500 uppercase">ONLINE</span>
            </div>
            <span className="hidden sm:inline-block text-[9px] font-black uppercase text-slate-500 tracking-widest">{user.name}</span>
            <button onClick={() => { setUser(null); setState(AppState.LOGIN); setIsMenuOpen(false); setEmail(''); setShowDevPassword(false); }} className="text-[10px] font-black text-red-500 uppercase px-4 py-2 bg-red-500/5 rounded-xl border border-red-500/10 hover:bg-red-500/10 transition-all">SAIR</button>
          </div>
        )}
      </header>

      {/* Menu Lateral */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
        <aside className={`absolute top-0 left-0 h-full w-80 bg-slate-900 border-r border-slate-800 transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} p-8 flex flex-col shadow-2xl`}>
          <div className="flex items-center gap-3 mb-10 border-b border-slate-800 pb-6">
             <LayoutDashboard className="text-indigo-500" size={24} />
             <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Terminal</h3>
          </div>
          <div className="flex-1 space-y-4">
            <button onClick={() => { setMode('essay'); setIsMenuOpen(false); setState(AppState.MAIN); setResult(''); }} className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all ${mode === 'essay' && state === AppState.MAIN ? 'bg-indigo-600 text-white' : 'bg-slate-950/50 text-slate-500 hover:bg-slate-800'}`}>
              <FileText size={20} /><p className="font-black text-xs uppercase italic tracking-wider">Redação</p>
            </button>
            <button onClick={() => { setMode('school'); setIsMenuOpen(false); setState(AppState.MAIN); setResult(''); }} className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all ${mode === 'school' && state === AppState.MAIN ? 'bg-cyan-600 text-white' : 'bg-slate-950/50 text-slate-500 hover:bg-slate-800'}`}>
              <BarChart3 size={20} /><p className="font-black text-xs uppercase italic tracking-wider">Escolar</p>
            </button>
            {user?.isDev && (
              <button onClick={() => { setState(AppState.ADMIN_PANEL); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all ${state === AppState.ADMIN_PANEL ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-red-950/20 text-red-500 border border-red-900/20 hover:bg-red-900/10'} mt-10`}>
                <ShieldAlert size={20} /><p className="font-black text-xs uppercase italic tracking-wider">Auditoria Root</p>
              </button>
            )}
          </div>
        </aside>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {state === AppState.LOGIN && (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Acesso Neural</h2>
              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-600 uppercase">
                <Activity size={12} className="text-indigo-500" />
                <span>{onlineCount} SESSÕES ATIVAS</span>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-black text-center uppercase animate-shake">{error}</div>}
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 font-bold outline-none focus:border-indigo-500 transition-all" placeholder="E-mail" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 font-bold outline-none focus:border-indigo-500 transition-all" placeholder="Senha" />
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all">CONECTAR</button>
              <button type="button" onClick={() => setState(AppState.SIGNUP)} className="w-full text-slate-600 text-[10px] font-black uppercase hover:text-white">NOVA CREDENCIAL</button>
              <div className="h-px bg-slate-800/50 w-full my-2"></div>
              <div onMouseDown={startRootPress} onMouseUp={cancelRootPress} onMouseLeave={cancelRootPress} onTouchStart={startRootPress} onTouchEnd={cancelRootPress} className="mt-4 text-center select-none">
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] cursor-default">EssayGen Pro</span>
              </div>
            </form>
          </div>
        )}

        {state === AppState.SIGNUP && (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl space-y-4 relative">
            <button onClick={() => setState(AppState.LOGIN)} className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
            <h2 className="text-3xl font-black text-white uppercase italic text-center tracking-tighter">Registro</h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 font-bold text-sm" placeholder="E-mail" />
              <input type="text" required value={signupUser} onChange={(e) => setSignupUser(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 font-bold text-sm" placeholder="Usuário" />
              <input type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 font-bold text-sm" placeholder="Senha" />
              <div className="space-y-1">
                <label className="text-[8px] font-black text-cyan-500 uppercase ml-2 italic tracking-widest">Chave Universal</label>
                <input type="text" required value={signupKey} onChange={(e) => setSignupKey(e.target.value)} className="w-full bg-cyan-950/10 border border-cyan-500/20 rounded-2xl py-3 px-6 font-mono font-black text-cyan-400 text-center uppercase" placeholder="KEY-XXXXXX" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase shadow-lg hover:bg-indigo-500">FINALIZAR</button>
            </form>
          </div>
        )}

        {state === AppState.ADMIN_PANEL && (
          <div className="max-w-4xl w-full bg-slate-900 border border-red-500/20 p-10 rounded-[2.5rem] shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3 text-red-500">
                <ShieldAlert /> 
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Monitor de Operadores</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/5 border border-green-500/20 rounded-full">
                  <Radio size={10} className="text-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">{activeEmails.length} ATIVOS AGORA</span>
                </div>
                <button onClick={() => setState(AppState.MAIN)} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors">FECHAR</button>
              </div>
            </div>
            
            <div className="grid gap-4 max-h-[32rem] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(getAllUsers()).length === 0 ? (
                <div className="py-20 text-center opacity-20"><Users size={80} className="mx-auto mb-4" /><p className="font-black uppercase text-xs tracking-[0.5em]">Vazio</p></div>
              ) : (
                Object.entries(getAllUsers()).map(([emailKey, u]) => {
                  const isOnline = activeEmails.includes(emailKey.toLowerCase());
                  return (
                    <div key={emailKey} className={`flex items-center justify-between p-6 bg-slate-950 border rounded-3xl transition-all group shadow-lg ${isOnline ? 'border-green-500/40 shadow-green-500/5' : 'border-slate-800'}`}>
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center font-black text-lg relative ${isOnline ? 'text-green-400' : 'text-slate-700'}`}>
                          {u.username ? u.username[0].toUpperCase() : '?'}
                          {isOnline && <Circle size={8} className="absolute -top-1 -right-1 fill-green-500 text-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <p className="font-black text-white text-base uppercase italic tracking-tight">{u.username}</p>
                            {isOnline && (
                              <span className="text-[7px] px-2 py-0.5 rounded-full font-black uppercase bg-green-500 text-slate-950 shadow-lg shadow-green-500/20">SISTEMA ATIVO</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono italic">
                            <Mail size={12} className="text-slate-700" />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteUser(u.email)} 
                        className="p-3 bg-red-500/5 text-red-500/30 rounded-2xl hover:bg-red-500 hover:text-white transition-all group-hover:text-red-500 group-hover:bg-red-500/10"
                        title="Eliminar Conta"
                      >
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {state === AppState.MAIN && (
          <div className="max-w-6xl w-full">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl mb-2">
                  <Activity size={14} className="text-indigo-400" />
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{mode === 'essay' ? 'Filtro Redação' : 'Filtro Trabalho'}</span>
                </div>
                <textarea 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 h-64 text-sm font-medium outline-none resize-none text-slate-200 focus:border-indigo-500 transition-all shadow-inner" 
                  placeholder="Instrua o motor aqui..."
                />
                <button onClick={handleGenerate} disabled={loading} className={`w-full font-black py-5 rounded-[2rem] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${mode === 'essay' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}>
                  {loading ? <RefreshCcw className="animate-spin" size={18}/> : "EXECUTAR"} <Send size={18}/>
                </button>
              </div>
              <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 p-10 rounded-[2.5rem] min-h-[600px] flex flex-col shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Terminal</h3>
                  {result && (
                    <div className="flex gap-2">
                      <button onClick={() => window.print()} className="p-3 bg-slate-800/80 rounded-xl text-slate-400 border border-slate-700 hover:text-white transition-all"><Printer size={18}/></button>
                      <button onClick={() => { navigator.clipboard.writeText(result); alert('COPIADO!'); }} className="p-3 bg-slate-800/80 rounded-xl text-slate-400 border border-slate-700 hover:text-white transition-all"><Copy size={18}/></button>
                    </div>
                  )}
                </div>
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <RefreshCcw className="w-16 h-16 text-indigo-500 animate-spin"/>
                  </div>
                ) : result ? (
                  <div className="flex-1 text-slate-300 whitespace-pre-wrap overflow-y-auto text-lg leading-relaxed custom-scrollbar pr-4">{result}</div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-5 select-none grayscale">
                    <LayoutDashboard size={140}/>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {state === AppState.KEY_CENTER && (
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/20 p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in slide-in-from-bottom-4 relative">
            <button onClick={() => setState(AppState.LOGIN)} className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
            <div className="text-center space-y-4"><Zap className="w-10 h-10 text-cyan-400 mx-auto" /><h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Cofre Neural</h2></div>
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[160px] shadow-inner">
              {isGeneratingKey ? <RefreshCcw className="w-8 h-8 text-cyan-500 animate-spin" /> : 
               generatedKey ? <div className="text-center animate-in zoom-in"><span className="text-4xl font-mono font-black text-white tracking-widest border-b-2 border-cyan-500/50 pb-2">{generatedKey}</span></div> :
               <p className="text-[11px] font-black text-slate-800 uppercase italic tracking-widest">Aguardando Pulso</p>}
            </div>
            <button onClick={() => { setIsGeneratingKey(true); setTimeout(() => { setGeneratedKey(generateUniversalKey()); setIsGeneratingKey(false); }, 1200); }} disabled={isGeneratingKey} className="w-full bg-cyan-600 text-white font-black py-6 rounded-3xl shadow-xl uppercase hover:bg-cyan-500 transition-all">GERAR CHAVE MESTRE</button>
          </div>
        )}

        {state === AppState.DEV_LOGIN && (
          <div className="max-w-md w-full bg-slate-900 border border-indigo-500/20 p-12 rounded-[3.5rem] shadow-2xl animate-in slide-in-from-bottom-12 relative">
            <button onClick={() => setState(AppState.LOGIN)} className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
            <div className="text-center space-y-4 mb-8"><Cpu className="w-12 h-12 text-indigo-400 mx-auto" /><h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Acesso Root</h2></div>
            <form onSubmit={(e) => { e.preventDefault(); if (devCode === DEV_SECRET_CODE) { setUser({ name: 'Super Admin', isDev: true, agreedToTerms: true }); setState(AppState.MAIN); } else { setError("CÓDIGO ROOT INCORRETO."); } }} className="space-y-6 text-center">
              <div className="relative">
                <input 
                  type={showDevPassword ? "text" : "password"} 
                  required 
                  value={devCode} 
                  onChange={(e) => setDevCode(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 font-black text-indigo-500 text-center tracking-[0.6em] outline-none focus:border-indigo-500 transition-all shadow-inner" 
                  placeholder="ROOT KEY" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowDevPassword(!showDevPassword)} 
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 hover:text-indigo-500 transition-colors p-2"
                >
                  {showDevPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl uppercase transition-all shadow-xl active:scale-95">OVERRIDE</button>
            </form>
          </div>
        )}

        {state === AppState.TERMS && (
           <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl animate-in zoom-in">
             <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-6">
                <Shield className="w-8 h-8 text-indigo-400" /><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Condutas</h2>
             </div>
             <div className="bg-slate-950 p-8 rounded-2xl h-80 overflow-y-auto text-[11px] text-slate-500 mb-8 font-mono leading-relaxed custom-scrollbar">{TERMS_CONTENT}</div>
             <div className="flex gap-4">
               <button onClick={() => { setUser(null); setState(AppState.LOGIN); }} className="flex-1 border border-slate-800 text-slate-600 py-4 rounded-xl font-black uppercase text-[10px] hover:bg-red-500/5 transition-colors">RECUSAR</button>
               <button onClick={() => setState(AppState.MAIN)} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl uppercase text-xs shadow-xl active:scale-95 transition-all shadow-indigo-500/10">CONCORDAR</button>
             </div>
           </div>
        )}
      </main>

      <footer className="p-8 text-center border-t border-slate-900/50 bg-slate-950 text-[9px] font-black text-slate-900 uppercase tracking-[0.5em] select-none flex items-center justify-center gap-6 relative z-10">
        <div className="flex items-center gap-2 text-indigo-500"><Users size={12} className="animate-pulse"/> <span>{onlineCount}/10 ATIVOS</span></div>
        <span>•</span>
        <div className="flex items-center">
          <span>v4.6.0-ROOT-MONITOR</span>
          {!user ? (
            <button 
              onMouseDown={startKeyCenterPress} onMouseUp={cancelKeyCenterPress} onMouseLeave={cancelKeyCenterPress} onTouchStart={startKeyCenterPress} onTouchEnd={cancelKeyCenterPress}
              className="text-slate-900 uppercase font-black cursor-default ml-1 focus:outline-none transition-none active:scale-100"
            >
              2025
            </button>
          ) : (
            <span className="opacity-0 pointer-events-none select-none ml-1">2025</span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
