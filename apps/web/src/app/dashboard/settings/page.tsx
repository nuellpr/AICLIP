"use client";

import { Save, User, Key, Settings as SettingsIcon, CheckCircle2, Loader2, LogOut, Camera, Lock } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getStoredUser, AuthUser, clearAuthSession, setAuthSession, getStoredToken } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'billing'>('profile');
  const [user, setUser] = useState<AuthUser | null>(null);

  const [provider, setProvider] = useState("google-gemini");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [model, setModel] = useState("gemini-2.0-flash");
  const [systemMessage, setSystemMessage] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Profile editable states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthDate, setEditBirthDate] = useState(""); // YYYY-MM-DD
  const [editBio, setEditBio] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success'|'error', text: string } | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success'|'error', text: string } | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    if (currentUser?.name) setEditName(currentUser.name);
    // fetch full profile from backend to get birthDate/phone/bio/image/hasPassword
    apiFetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          const u = data.user;
          setUser(u);
          setAuthSession(getStoredToken() || '', u);
          setEditName(u.name || "");
          setEditPhone(u.phone || "");
          setEditBio(u.bio || "");
          if (u.birthDate) {
            try { setEditBirthDate(new Date(u.birthDate).toISOString().slice(0,10)); } catch {}
          }
          if (u.image) setPreviewImage(u.image);
          setHasPassword(!!u.hasPassword || !!u.password);
        }
      }).catch(()=>{});
    apiFetch('/api/settings/ai')
      .then(res => res.json())
      .then(data => {
        if (data.provider !== undefined) setProvider(data.provider);
        if (data.baseUrl !== undefined) setBaseUrl(data.baseUrl);
        if (data.apiKey !== undefined) setApiKey(data.apiKey);
        setApiKeySet(!!data.apiKeySet);
        setModel(data.model || '');
        if (data.systemMessage !== undefined) setSystemMessage(data.systemMessage);
      })
      .catch(console.error);
  }, []);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProvider(val);
    if (val === 'openai') setBaseUrl("https://api.openai.com/v1");
    else if (val === 'groq') setBaseUrl("https://api.groq.com/openai/v1");
    else if (val === 'b-ai') setBaseUrl("https://b.ai/v1");
    else if (val === 'google-gemini') setBaseUrl("");
    else if (val === 'custom') setBaseUrl("http://localhost:11434/v1");
  };

  const handleLoadModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await apiFetch('/api/settings/ai/models', {
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
      await apiFetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, baseUrl, apiKey, model, systemMessage })
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Foto maksimal 2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        phone: editPhone.trim() || null,
        bio: editBio.trim() || null,
        birthDate: editBirthDate || null,
        image: previewImage,
      };
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil');
      const token = getStoredToken() || '';
      setAuthSession(token, data.user);
      setUser(data.user);
      setProfileMsg({ type: 'success', text: 'Profil berhasil disimpan' });
      setTimeout(()=> setProfileMsg(null), 3000);
    } catch (e: unknown) {
      setProfileMsg({ type: 'error', text: e instanceof Error ? e.message : 'Gagal menyimpan' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 8 karakter' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Gagal ganti password');
      setPasswordMsg({ type: 'success', text: 'Password berhasil diubah' });
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setHasPassword(true);
      setTimeout(()=> setPasswordMsg(null), 3000);
    } catch (e: unknown) {
      setPasswordMsg({ type: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setIsSavingPassword(false);
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
            <User className={`h-5 w-5 ${activeTab === 'profile' ? 'text-blue-400' : ''}`} /> Profil Akun
          </button>
          
          <button 
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'ai' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <SettingsIcon className={`h-5 w-5 ${activeTab === 'ai' ? 'text-blue-400' : ''}`} /> AI Models
          </button>
          
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'billing' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <Key className={`h-5 w-5 ${activeTab === 'billing' ? 'text-blue-400' : ''}`} /> Penagihan
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-6">
            
            {activeTab === 'profile' && (
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold">Profil Akun</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">{user?.email?.includes('google') || user?.image ? 'Google' : 'Email'}</span>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImage} alt={user?.name || 'User'} className="h-20 w-20 rounded-2xl object-cover border border-blue-400/30" />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-black text-black text-xl">
                        {(editName || user?.name || 'DU').substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <button onClick={()=> fileRef.current?.click()} className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-400 text-black p-2 rounded-xl shadow-lg transition-colors" title="Ganti foto">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-white">{editName || user?.name || 'Demo User'}</p>
                    <p className="text-sm text-gray-400">{user?.email || 'demo@clipforge.ai'}</p>
                    <button onClick={()=> fileRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline">Ganti foto profil</button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                    <p className="text-[10px] text-gray-500 mt-1">JPG/PNG max 2MB. Bisa foto sendiri atau URL Google.</p>
                  </div>
                </div>

                {profileMsg && (
                  <div className={`p-3 rounded-xl text-xs font-medium border ${profileMsg.type==='success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                    {profileMsg.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nama Lengkap *</label>
                    <input type="text" value={editName} onChange={e=> setEditName(e.target.value)} placeholder="Nama kamu" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Alamat Email</label>
                    <input type="email" value={user?.email || ""} disabled className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-gray-400 font-medium cursor-not-allowed" />
                    <p className="text-xs text-gray-500 mt-1">Email tidak bisa diubah. Login via Google terhubung ke email ini.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tanggal Lahir</label>
                      <input type="date" value={editBirthDate} onChange={e=> setEditBirthDate(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">No. HP / WhatsApp</label>
                      <input type="tel" value={editPhone} onChange={e=> setEditPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio <span className="text-gray-500 font-normal">(opsional)</span></label>
                    <textarea rows={3} value={editBio} onChange={e=> setEditBio(e.target.value)} placeholder="Ceritain kamu kreator di niche apa..." className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" maxLength={500} />
                    <p className="text-xs text-gray-500 text-right mt-1">{editBio.length}/500</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-black px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50">
                    {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Profil
                  </button>
                </div>

                {/* Password Section */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-400" />
                    <h4 className="font-bold text-white">Password</h4>
                    <span className="text-xs text-gray-400 ml-2">{hasPassword ? '• sudah ada password' : '• belum ada password (Google only)'}</span>
                  </div>
                  {passwordMsg && (
                    <div className={`p-3 rounded-xl text-xs font-medium border ${passwordMsg.type==='success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                      {passwordMsg.text}
                    </div>
                  )}
                  {hasPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password Lama</label>
                      <input type="password" value={oldPassword} onChange={e=> setOldPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{hasPassword ? 'Password Baru' : 'Buat Password'}</label>
                      <input type="password" value={newPassword} onChange={e=> setNewPassword(e.target.value)} placeholder="min 8 karakter" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Konfirmasi Password</label>
                      <input type="password" value={confirmPassword} onChange={e=> setConfirmPassword(e.target.value)} placeholder="ulang password baru" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSavePassword} disabled={isSavingPassword} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50">
                      {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} {hasPassword ? 'Ganti Password' : 'Simpan Password'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Password dipakai kalau mau login pakai email+password. Akun Google tetap bisa login tanpa password.</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => { clearAuthSession(); router.push('/login'); }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-3 font-bold transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Keluar / Logout
                  </button>
                </div>
              </>
            )}

            {activeTab === 'ai' && (
              <>
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <SettingsIcon className="h-5 w-5 text-blue-400" />
                  <h3 className="text-xl font-bold">Provider Type</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <select 
                      value={provider}
                      onChange={handleProviderChange}
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                    >
                      <option value="google-gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="groq">Groq</option>
                      <option value="b-ai">B.ai (single key)</option>
                      <option value="custom">Custom / Local</option>
                    </select>
                  </div>

                  <div className="pt-4 flex items-center gap-2 border-b border-white/10 pb-4">
                    <Key className="h-5 w-5 text-blue-400" />
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
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                      <input 
                        type="password" 
                        placeholder={apiKeySet ? "•••••••• (key tersimpan)" : "sk-..."} 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {apiKeySet && (
                        <p className="text-xs text-gray-500 mt-1">Key aktif tersimpan. Kosongkan atau ketik key baru untuk menggantinya.</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                      <div className="flex gap-2">
                        {availableModels.length > 0 ? (
                          <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                            className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-white/10">
                    <button 
                      onClick={handleSaveAi}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-black px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
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
