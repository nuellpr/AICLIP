"use client";

import { Save, User, Key, Settings as SettingsIcon, CheckCircle2, Loader2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import { getStoredUser, AuthUser } from "@/lib/auth";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'billing'>('profile');
  const [user, setUser] = useState<AuthUser | null>(null);
  
  const [provider, setProvider] = useState("google-gemini");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.0-flash");
  const [systemMessage, setSystemMessage] = useState("");
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    const userIdQuery = currentUser?.id ? `?userId=${currentUser.id}` : '';
    fetch(getApiUrl(`/api/settings/ai${userIdQuery}`))
      .then(res => res.json())
      .then(data => {
        if (data.provider !== undefined) setProvider(data.provider);
        if (data.baseUrl !== undefined) setBaseUrl(data.baseUrl);
        if (data.apiKey !== undefined) setApiKey(data.apiKey);
        setModel(data.model || '');
        if (data.systemMessage !== undefined) setSystemMessage(data.systemMessage);
      })
      .catch(console.error);
  }, []);

  const handleProviderChange = (e: any) => {
    const val = e.target.value;
    setProvider(val);
    if (val === 'openai') setBaseUrl("https://api.openai.com/v1");
    else if (val === 'groq') setBaseUrl("https://api.groq.com/openai/v1");
    else if (val === 'google-gemini') setBaseUrl("");
    else if (val === 'custom') setBaseUrl("http://localhost:11434/v1"); // ollama default
  };

  const handleLoadModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch(getApiUrl('/api/settings/ai/models'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, baseUrl, apiKey })
      });
      const data = await res.json();
      if (data.models) {
        setAvailableModels(data.models);
        if (data.models.length > 0 && (!model || !data.models.includes(model))) {
          setModel(data.models[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveAi = async () => {
    setIsSaving(true);
    try {
      await fetch(getApiUrl('/api/settings/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, baseUrl, apiKey, model, systemMessage, userId: user?.id })
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-gray-400 mt-1">Kelola preferensi akun dan konfigurasi AI Anda.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <User className={`h-5 w-5 ${activeTab === 'profile' ? 'text-cyan-400' : ''}`} /> Profil Akun
          </button>
          
          <button 
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'ai' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <SettingsIcon className={`h-5 w-5 ${activeTab === 'ai' ? 'text-cyan-400' : ''}`} /> AI Models
          </button>
          
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'billing' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <Key className={`h-5 w-5 ${activeTab === 'billing' ? 'text-cyan-400' : ''}`} /> Penagihan
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-6">
            
            {activeTab === 'profile' && (
              <>
                <h3 className="text-xl font-bold border-b border-white/10 pb-4">Profil Akun (Mode Demo)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nama Lengkap</label>
                    <input type="text" value={user?.name || "Demo User"} disabled className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-gray-300 font-bold cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Alamat Email</label>
                    <input type="email" value={user?.email || "demo@clipforge.ai"} disabled className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-gray-300 font-bold cursor-not-allowed" />
                    <p className="text-xs text-gray-500 mt-2">Perubahan email dinonaktifkan pada versi MVP/Demo.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'ai' && (
              <>
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <SettingsIcon className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-xl font-bold">Provider Type</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <select 
                      value={provider}
                      onChange={handleProviderChange}
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none"
                    >
                      <option value="google-gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="groq">Groq</option>
                      <option value="custom">Custom / Local</option>
                    </select>
                  </div>

                  <div className="pt-4 flex items-center gap-2 border-b border-white/10 pb-4">
                    <Key className="h-5 w-5 text-cyan-400" />
                    <h3 className="text-xl font-bold">API Configuration</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                      <input 
                        type="text" 
                        placeholder="https://api.openai.com/v1" 
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                      <input 
                        type="password" 
                        placeholder="sk-..." 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                      <div className="flex gap-2">
                        {availableModels.length > 0 ? (
                          <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          >
                            {availableModels.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            placeholder="gpt-4o-mini" 
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                          />
                        )}
                        
                        <button 
                          onClick={handleLoadModels}
                          disabled={isLoadingModels}
                          className="px-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-2"
                        >
                          {isLoadingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">System Message <span className="text-gray-500 font-normal">(Opsional)</span></label>
                      <textarea 
                        rows={3}
                        placeholder="Instruksi kustom untuk mendeteksi highlight..." 
                        value={systemMessage}
                        onChange={(e) => setSystemMessage(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-white/10">
                    <button 
                      onClick={handleSaveAi}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />)} 
                      {isSaved ? "Tersimpan!" : "Simpan Pengaturan"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'billing' && (
              <>
                <h3 className="text-xl font-bold border-b border-white/10 pb-4">Penagihan & Paket</h3>
                <div className="py-8 text-center text-gray-400">
                  <p>Fitur penagihan belum tersedia di versi MVP ini.</p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
