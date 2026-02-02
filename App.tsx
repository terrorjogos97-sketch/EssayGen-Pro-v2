
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppState, User, BanInfo, EssayRequest, StoredUser } from './types';
import { DEV_SECRET_CODE, TERMS_CONTENT, DISCORD_INVITE_CODE } from './constants';
import { 
  Shield, Lock, Cpu, LogOut, Send, BookOpen, PenTool, 
  User as UserIcon, Key, RefreshCcw, Copy, 
  ArrowLeft, Zap, Eye, EyeOff, ToggleLeft, 
  ToggleRight, AlertTriangle, XCircle, Mail, Users, Trash2, ShieldAlert,
  BarChart3, FileText, Printer, Menu, X, LayoutDashboard
} from 'lucide-react';

// --- MOTOR IA ---
const callGemini = async (request: EssayRequest & { isGraphic?: boolean }): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let systemInstruction = `Atue como um redator profissional e acadêmico de elite. `;
    
    if (request.isGraphic) {
      systemInstruction += `Crie um trabalho escolar completo sobre o tema "${request.topic}". 
      OBRIGATÓRIO: Inclua dados estatísticos e crie uma representação visual de "GRÁFICO" usando caracteres Markdown, tabelas ou ASCII Art de barras. 
      O resultado deve ser um documento acadêmico pronto para ser copiado.`;
    } else {
      systemInstruction += `Escreva um(a) ${request.type} sobre o tema: "${request.topic}". Tom: ${request.tone}. Responda em Português do Brasil com formatação Markdown impecável.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemInstruction,
    });
    return response.text || "Erro na geração.";
  } catch (error) {
    throw new Error("Falha na conexão.");
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'essay' | 'school'>('essay');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Timers para acessos secretos
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

  // Lógica de Long Press - ROOT (3s)
  const startRootPress = () => {
    rootPressTimer.current = setTimeout(() => {
      setState(AppState.DEV_LOGIN);
    }, 3000);
  };

  const cancelRootPress = () => {
    if (rootPressTimer.current) clearTimeout(rootPressTimer.current);
  };

  // Lógica de Long Press - KEY CENTER (10s)
  const startKeyCenterPress = () => {
    keyPressTimer.current = setTimeout(() => {
      setState(AppState.KEY_CENTER);
    }, 10000); // 10 Segundos
  };

  const cancelKeyCenterPress = () => {
    if (keyPressTimer.current) clearTimeout(keyPressTimer.current);
  };

  const getHourlyKey = () => {
    const now = new Date();
    const seed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) { hash = ((hash << 5) - hash) + seed.charCodeAt(i); hash |= 0; }
    return "KEY-" + Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
  };

  useEffect(() => {
    const sessionId = (window as any).sessionId || Math.random().toString(36).substring(7);
    (window as any).sessionId = sessionId;

    const updatePresence = () => {
      const now = Date.now();
      const sessions = JSON.parse(localStorage.getItem('essaygen_sessions_v4') || '{}');
      const activeSessions: Record<string, number> = {};
      Object.keys(sessions).forEach(id => {
        if (now - sessions[id] < 12000) activeSessions[id] = sessions[id];
      });
      activeSessions[sessionId] = now;
      localStorage.setItem('essaygen_sessions_v4', JSON.stringify(activeSessions));
      setOnlineCount(Object.keys(activeSessions).length);
    };

    updatePresence();
    const interval = setInterval(updatePresence, 4000);
    return () => clearInterval(interval);
  }, []);

  const getAllUsers = (): Record<string, StoredUser> => JSON.parse(localStorage.getItem('essaygen_users') || '{}');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.toLowerCase().trim();
    const isAdmin = normalizedEmail.includes('admin');
    if (onlineCount >= 10 && !isAdmin) {
      setError("ACESSO NEGADO: SERVIDOR LOTADO (10/10)."); 
      return;
    }
    const users = getAllUsers();
    const userData = users[normalizedEmail];
    if (userData && userData.password === password) {
      const bans = JSON.parse(localStorage.getItem('essaygen_bans') || '{}');
      if (bans[normalizedEmail]) { setState(AppState.BANNED); return; }
      setUser({ name: userData.username, isDev: isAdmin, agreedToTerms: false });
      setState(AppState.TERMS);
    } else { setError("E-MAIL OU SENHA INCORRETOS."); }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const inputKey = signupKey.toUpperCase().trim();
    if (!inputKey.startsWith("KEY-") && inputKey !== DISCORD_INVITE_CODE) {
      setError("CHAVE INVÁLIDA."); return;
    }
    const users = getAllUsers();
    const normalizedEmail = signupEmail.toLowerCase().trim();
    const normalizedUser = signupUser.trim();
    if (users[normalizedEmail]) { setError("E-MAIL CADASTRADO."); return; }
    const userExists = Object.values(users).some(u => u.username.toLowerCase() === normalizedUser.toLowerCase());
    if (userExists) { setError("NOME JÁ EXISTE NO SISTEMA."); return; }
    users[normalizedEmail] = { username: normalizedUser, password: signupPassword, email: normalizedEmail, createdAt: Date.now() };
    localStorage.setItem('essaygen_users', JSON.stringify(users));
    setUser({ name: normalizedUser, isDev: false, agreedToTerms: false });
    setState(AppState.TERMS);
  };

  const banUser = (targetEmail: string) => {
    const bans = JSON.parse(localStorage.getItem('essaygen_bans') || '{}');
    bans[targetEmail.toLowerCase()] = { type: 'permanent', reason: 'BANIDO PELO ADMIN', bannedAt: Date.now() };
    localStorage.setItem('essaygen_bans', JSON.stringify(bans));
    alert(`O usuário foi removido do sistema.`);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const text = await callGemini({ topic, type: 'essay', tone: 'formal', wordCount: 500, isGraphic: mode === 'school' });
      setResult(text);
    } catch (e) { setError("FALHA CRÍTICA NA IA."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 relative overflow-hidden">
      
      {/* BACKGROUND GLOW SPHERES (Bolas de brilho pulsantes) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-neural-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/20 blur-[150px] animate-neural-glow delay-2000"></div>
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[100px] animate-neural-glow delay-4000"></div>
      </div>

      <header className="border-b border-slate-900 p-4 bg-slate-950/80 backdrop-blur-md flex justify-between items-center sticky top-0 z-[110]">
        <div className="flex items-center gap-4">
          {user && state === AppState.MAIN && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-3 bg-slate-900/50 hover:bg-slate-800 rounded-xl transition-all text-indigo-400 border border-slate-800"
            >
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
            <span className="hidden sm:inline-block text-[9px] font-black uppercase text-slate-500 tracking-widest">{user.name}</span>
            <button onClick={() => { setUser(null); setState(AppState.LOGIN); setIsMenuOpen(false); }} className="text-[10px] font-black text-red-500 uppercase px-4 py-2 bg-red-500/5 rounded-xl border border-red-500/10 hover:bg-red-500/10 transition-all">SAIR</button>
          </div>
        )}
      </header>

      {/* Menu Lateral Estilizado */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
        <aside className={`absolute top-0 left-0 h-full w-80 bg-slate-900 border-r border-slate-800 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)] transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} p-8 flex flex-col`}>
          <div className="flex items-center gap-3 mb-10 border-b border-slate-800 pb-6">
             <LayoutDashboard className="text-indigo-500" size={24} />
             <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Painel de Controle</h3>
          </div>
          
          <div className="flex-1 space-y-4">
            <button 
              onClick={() => { setMode('essay'); setIsMenuOpen(false); setResult(''); }}
              className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 ${mode === 'essay' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-950/50 text-slate-500 border border-slate-800 hover:text-white hover:border-indigo-500/50'}`}
            >
              <div className={`p-3 rounded-2xl ${mode === 'essay' ? 'bg-white/10' : 'bg-slate-900'}`}><FileText size={20} /></div>
              <div className="text-left">
                <p className="font-black text-xs uppercase italic tracking-wider">Criar Texto</p>
                <p className="text-[8px] uppercase font-black opacity-50">Redações e Artigos</p>
              </div>
            </button>

            <button 
              onClick={() => { setMode('school'); setIsMenuOpen(false); setResult(''); }}
              className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 ${mode === 'school' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-600/20' : 'bg-slate-950/50 text-slate-500 border border-slate-800 hover:text-white hover:border-cyan-500/50'}`}
            >
              <div className={`p-3 rounded-2xl ${mode === 'school' ? 'bg-white/10' : 'bg-slate-900'}`}><BarChart3 size={20} /></div>
              <div className="text-left">
                <p className="font-black text-xs uppercase italic tracking-wider">Criar Gráfico</p>
                <p className="text-[8px] uppercase font-black opacity-50">Trabalhos Escolares</p>
              </div>
            </button>

            {user?.isDev && (
              <button 
                onClick={() => { setState(AppState.ADMIN_PANEL); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-4 p-5 rounded-3xl bg-red-950/20 text-red-500 border border-red-900/20 hover:bg-red-900/30 transition-all mt-10"
              >
                <div className="p-3 rounded-2xl bg-red-900/20"><ShieldAlert size={20} /></div>
                <p className="font-black text-xs uppercase italic tracking-wider">Auditoria Root</p>
              </button>
            )}
          </div>
        </aside>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {state === AppState.LOGIN && (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl space-y-6 animate-in zoom-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white uppercase italic select-none">Acesso Neural</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{onlineCount}/10 ATIVOS NO SISTEMA</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-black text-center uppercase">{error}</div>}
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 font-bold outline-none focus:border-indigo-500 transition-all" placeholder="E-mail" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 font-bold outline-none focus:border-indigo-500 transition-all" placeholder="Senha" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-xl">CONECTAR</button>
              <button type="button" onClick={() => setState(AppState.SIGNUP)} className="w-full text-slate-600 text-[10px] font-black uppercase">NOVA CREDENCIAL</button>
              
              <div className="h-px bg-slate-800/50 w-full my-2"></div>

              {/* Gatilho ROOT (3s - Sem Animação de Clique) */}
              <div 
                onMouseDown={startRootPress}
                onMouseUp={cancelRootPress}
                onMouseLeave={cancelRootPress}
                onTouchStart={startRootPress}
                onTouchEnd={cancelRootPress}
                className="mt-4 text-center select-none"
              >
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] cursor-default">EssayGen Pro</span>
              </div>
            </form>
          </div>
        )}

        {state === AppState.SIGNUP && (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl space-y-4 animate-in zoom-in relative">
            <button onClick={() => setState(AppState.LOGIN)} className="absolute top-8 left-8 text-slate-500"><ArrowLeft size={18}/></button>
            <h2 className="text-3xl font-black text-white uppercase italic text-center">Registro</h2>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-black text-center uppercase">{error}</div>}
              <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 font-bold text-sm" placeholder="Seu E-mail" />
              <input type="text" required value={signupUser} onChange={(e) => setSignupUser(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 font-bold text-sm" placeholder="Nome de Usuário Único" />
              <input type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 font-bold text-sm" placeholder="Senha" />
              <div className="space-y-1">
                <label className="text-[8px] font-black text-cyan-500 uppercase ml-2 italic">Chave Universal do Portal</label>
                <input type="text" required value={signupKey} onChange={(e) => setSignupKey(e.target.value)} className="w-full bg-cyan-950/10 border border-cyan-500/20 rounded-2xl py-3 px-6 font-mono font-black text-cyan-400 text-center uppercase" placeholder="KEY-XXXXXX" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase mt-2 shadow-lg">FINALIZAR CONTA</button>
            </form>
          </div>
        )}

        {state === AppState.ADMIN_PANEL && (
          <div className="max-w-4xl w-full bg-slate-900 border border-red-500/20 p-10 rounded-[2.5rem] shadow-2xl space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3 text-red-500"><ShieldAlert /> <h2 className="text-xl font-black uppercase italic tracking-tighter">Gerenciamento de Contas</h2></div>
              <button onClick={() => setState(AppState.MAIN)} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors">VOLTAR</button>
            </div>
            <div className="grid gap-3 max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(getAllUsers()).map(([email, u]) => (
                <div key={email} className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-red-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 font-black text-xs">{u.username[0]}</div>
                    <div>
                      <p className="font-bold text-white text-sm">{u.username}</p>
                      <p className="text-[9px] text-slate-600 font-mono italic">{email}</p>
                    </div>
                  </div>
                  <button onClick={() => banUser(email)} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                    <Trash2 size={12}/> BANIR
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {state === AppState.MAIN && (
          <div className="max-w-6xl w-full animate-in fade-in duration-700">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
                   {mode === 'essay' ? <FileText className="text-indigo-500" size={20}/> : <BarChart3 className="text-cyan-500" size={20}/>}
                   <p className="font-black text-[10px] uppercase italic tracking-widest text-white">
                     Foco: {mode === 'essay' ? 'Redação/Texto' : 'Trabalho/Gráfico'}
                   </p>
                </div>
                <textarea 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 h-64 text-sm font-medium focus:border-indigo-500 outline-none resize-none shadow-inner text-slate-200 placeholder-slate-800" 
                  placeholder={mode === 'essay' ? "O que você deseja escrever hoje?" : "Quais dados ou tema escolar para o gráfico?"}
                />
                <button onClick={handleGenerate} disabled={loading} className={`w-full font-black py-5 rounded-3xl uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${mode === 'essay' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}>
                  {loading ? "PROCESSANDO..." : "EXECUTAR"} <Send size={18}/>
                </button>
              </div>

              <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 p-10 rounded-[2.5rem] min-h-[600px] flex flex-col shadow-2xl backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${mode === 'essay' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                      {mode === 'essay' ? <FileText size={20}/> : <BarChart3 size={20}/>}
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Terminal de Saída</h3>
                  </div>
                  {result && (
                    <div className="flex gap-2">
                      <button onClick={() => window.print()} className="p-3 bg-slate-800/80 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700 hover:scale-105 active:scale-95" title="Exportar para PDF"><Printer size={18}/></button>
                      <button onClick={() => { navigator.clipboard.writeText(result); alert('Copiado com sucesso!'); }} className="p-3 bg-slate-800/80 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700 hover:scale-105 active:scale-95" title="Copiar Texto"><Copy size={18}/></button>
                    </div>
                  )}
                </div>
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-pulse">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                      <RefreshCcw className="w-16 h-16 text-indigo-500 animate-spin relative z-10"/>
                    </div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">Redigindo via Rede Neural...</p>
                  </div>
                ) : result ? (
                  <div className="flex-1 text-slate-300 leading-relaxed text-lg whitespace-pre-wrap font-medium animate-in fade-in prose prose-invert max-w-none custom-scrollbar overflow-y-auto">
                    {result}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-5 grayscale select-none pointer-events-none">
                    <LayoutDashboard size={140}/>
                    <p className="text-[10px] font-black uppercase tracking-[1.5em] mt-8">Aguardando Input do Usuário</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {state === AppState.KEY_CENTER && (
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/20 p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in slide-in-from-bottom-4">
            <button onClick={() => setState(AppState.LOGIN)} className="text-slate-500 hover:text-white"><ArrowLeft size={18}/></button>
            <div className="text-center space-y-4"><Zap className="w-10 h-10 text-cyan-400 mx-auto" /><h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Cofre de Ativação</h2></div>
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[160px] shadow-inner">
              {isGeneratingKey ? <RefreshCcw className="w-8 h-8 text-cyan-500 animate-spin" /> : 
               generatedKey ? <div className="text-center animate-in zoom-in"><span className="text-4xl font-mono font-black text-white tracking-widest border-b-2 border-cyan-500/50 pb-2">{generatedKey}</span></div> :
               <p className="text-[11px] font-black text-slate-800 uppercase italic tracking-widest italic">Criptografia Ativa</p>}
            </div>
            <button onClick={() => { if(generatedKey) return; setIsGeneratingKey(true); setTimeout(() => { setGeneratedKey(getHourlyKey()); setIsGeneratingKey(false); }, 1200); }} disabled={!!generatedKey} className={`w-full font-black py-6 rounded-3xl shadow-xl uppercase transition-all active:scale-95 ${generatedKey ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>{generatedKey ? "CHAVE ATIVA" : "GERAR CHAVE MESTRE"}</button>
          </div>
        )}

        {state === AppState.DEV_LOGIN && (
          <div className="max-w-md w-full bg-slate-900 border border-indigo-500/20 p-12 rounded-[3.5rem] shadow-2xl animate-in slide-in-from-bottom-12 relative">
            <button onClick={() => setState(AppState.LOGIN)} className="absolute top-8 left-8 text-slate-500 hover:text-white"><ArrowLeft size={18}/></button>
            <div className="flex flex-col items-center gap-4 mb-8"><Cpu className="w-12 h-12 text-indigo-400/80" /><h2 className="text-2xl font-black text-white uppercase italic text-center tracking-tight">Root Override</h2></div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (devCode === DEV_SECRET_CODE) { 
                setUser({ name: 'Super Admin', isDev: true, agreedToTerms: true }); 
                setState(AppState.MAIN); 
              } else { setError("CÓDIGO ROOT INCORRETO."); }
            }} className="space-y-6">
              <input type="password" required value={devCode} onChange={(e) => setDevCode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 outline-none font-black text-indigo-500 text-center tracking-[0.6em] focus:border-indigo-500 transition-all shadow-inner" placeholder="ROOT KEY" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest active:scale-95 transition-all">DESTRAVAR NÚCLEO</button>
            </form>
          </div>
        )}

        {state === AppState.TERMS && (
           <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl animate-in zoom-in">
             <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-6"><Shield className="w-8 h-8 text-indigo-400" /><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Condutas Éticas</h2></div>
             <div className="bg-slate-950 p-8 rounded-2xl h-80 overflow-y-auto font-mono text-[11px] text-slate-500 mb-8 leading-relaxed italic border border-slate-900/30 custom-scrollbar">{TERMS_CONTENT}</div>
             <div className="flex gap-4">
               <button onClick={() => { setUser(null); setState(AppState.LOGIN); }} className="flex-1 border border-slate-800 text-slate-600 py-4 rounded-xl font-black text-[10px] uppercase hover:bg-red-500/5 transition-colors">RECUSAR</button>
               <button onClick={() => setState(AppState.MAIN)} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl uppercase text-xs shadow-xl active:scale-95 transition-all">CONCORDAR E CONTINUAR</button>
             </div>
           </div>
        )}
      </main>

      <footer className="p-8 text-center border-t border-slate-900/50 bg-slate-950 text-[9px] font-black text-slate-900 uppercase tracking-[0.5em] select-none flex items-center justify-center gap-6 relative z-10">
        <div className="flex items-center gap-2 text-indigo-500"><Users size={12}/> <span>{onlineCount}/10 ATIVOS</span></div>
        <span>•</span>
        <div className="flex items-center">
          <span>v4.2.0-ULTRA-ROOT</span>
          {!user ? (
            <button 
              onMouseDown={startKeyCenterPress}
              onMouseUp={cancelKeyCenterPress}
              onMouseLeave={cancelKeyCenterPress}
              onTouchStart={startKeyCenterPress}
              onTouchEnd={cancelKeyCenterPress}
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
