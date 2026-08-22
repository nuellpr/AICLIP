'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Video, DollarSign, Activity, Server, Plus, RefreshCw, AlertCircle, CheckCircle2, X, Cpu, Sparkles, Lock } from 'lucide-react';
import { getStoredUser, AuthUser } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalClips: number;
  totalRevenue: number;
  dailyStats: { date: string; count: number }[];
}

interface QueueInfo {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueData {
  redis: { status: string; url: string };
  queues: QueueInfo[];
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  plan: string;
  credits: number;
  projectCount: number;
}

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Credit Top-Up Modal State
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(50);
  const [creditMode, setCreditMode] = useState<'ADD' | 'SET'>('ADD');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    if (user && user.role !== 'ADMIN') {
      setLoading(false);
      return;
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, queuesRes, usersRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/queues'),
        apiFetch('/api/admin/users'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (queuesRes.ok) {
        const qData = await queuesRes.json();
        setQueueData(qData);
      }

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
    } catch (err: unknown) {
      console.error('Error fetching admin data:', err);
      setError('Gagal memuat data konsol admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionSuccess(null);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/users/${selectedUser.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsToAdd: creditAmount, mode: creditMode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui kredit');

      setActionSuccess(data.message || 'Kredit pengguna berhasil diperbarui!');
      fetchAdminData();
      setTimeout(() => {
        setSelectedUser(null);
        setActionSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menambah kredit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to toggle role:', err);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const maxDailyCount = stats?.dailyStats ? Math.max(...stats.dailyStats.map((d) => d.count), 1) : 1;

  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
          <Lock className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Akses Ditolak (Hanya Khusus Admin)</h2>
        <p className="text-sm text-gray-400 max-w-md">
          Halaman Console Admin hanya dapat diakses oleh Administrator sistem. Akun Anda (<span className="text-blue-400 font-bold">{currentUser.email}</span>) terdaftar sebagai Pengguna Biasa.
        </p>
        <a href="/dashboard" className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-black font-extrabold px-6 py-3 rounded-2xl text-xs transition-transform hover:scale-105">
          Kembali ke Dashboard Proyek
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/30">
              Admin Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <span>Manajemen Pengguna & Server</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitoring beban antrean BullMQ, server Redis, grafik statistik harian, dan kontrol kredit akun pengguna.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Realtime</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pengguna</p>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4">{stats?.totalUsers ?? 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">Akun terdaftar dalam sistem</p>
        </div>

        <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proyek Diproses</p>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4">{stats?.totalProjects ?? 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">{stats?.totalClips ?? 0} Klip berhasil dirender</p>
        </div>

        <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden group hover:border-green-500/40 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pendapatan</p>
            <div className="p-2.5 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4">{formatRupiah(stats?.totalRevenue ?? 0)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Transaksi settlement Midtrans</p>
        </div>

        <div className="rounded-3xl glass-card p-6 border border-white/10 relative overflow-hidden group hover:border-yellow-500/40 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kesehatan Redis</p>
            <div className="p-2.5 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-xl font-black text-white uppercase">{queueData?.redis?.status || 'READY'}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 truncate">{queueData?.redis?.url || '127.0.0.1:6379'}</p>
        </div>
      </div>

      {/* Chart & Queue Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Video Processing Chart (8 Cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span>Pemrosesan Video (7 Hari Terakhir)</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Grafik jumlah klip video yang diproses per hari</p>
            </div>
            <span className="text-[11px] text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Realtime Activity
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="flex items-end justify-between gap-3 h-48 pt-6 px-2 border-b border-white/10 pb-2">
            {stats?.dailyStats?.map((d, index) => {
              const heightPercent = Math.max(10, Math.round((d.count / maxDailyCount) * 100));
              const dayName = new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' });
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-blue-500/40 via-blue-400 to-purple-500 rounded-t-xl group-hover:from-blue-400 group-hover:to-pink-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  ></div>
                  <span className="text-[10px] text-gray-400 font-semibold mt-1">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BullMQ Queues Monitor (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              <span>Beban Antrean BullMQ</span>
            </h2>
          </div>

          <div className="space-y-4">
            {queueData?.queues?.map((q, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-400">{q.name}</p>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                    {q.active} Aktif
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-gray-400 font-semibold">Aktif</p>
                    <p className="text-sm font-black text-blue-400 mt-0.5">{q.active}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-gray-400 font-semibold">Antri</p>
                    <p className="text-sm font-black text-yellow-400 mt-0.5">{q.waiting}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-gray-400 font-semibold">Selesai</p>
                    <p className="text-sm font-black text-green-400 mt-0.5">{q.completed}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-gray-400 font-semibold">Gagal</p>
                    <p className="text-sm font-black text-red-400 mt-0.5">{q.failed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="space-y-4 border-t border-white/10 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Manajemen Akun Pengguna & Kredit</h2>
            <p className="text-xs text-gray-400">Kelola kredit AI menit dan hak akses admin untuk setiap akun.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10 glass-card">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Pengguna</th>
                <th className="p-4">Role</th>
                <th className="p-4">Paket</th>
                <th className="p-4">Sisa Kredit</th>
                <th className="p-4">Total Proyek</th>
                <th className="p-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-[10px] text-gray-400">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 hover:bg-purple-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-white/10'
                      }`}
                    >
                      {u.role}
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[10px]">
                      {u.plan}
                    </span>
                  </td>
                  <td className="p-4 font-black text-white text-sm">
                    {u.credits} <span className="text-[10px] text-gray-400 font-semibold">menit</span>
                  </td>
                  <td className="p-4 font-semibold text-gray-300">{u.projectCount} Proyek</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/30 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kredit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Top-up Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="rounded-3xl glass-panel p-6 sm:p-8 max-w-md w-full border border-blue-500/40 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative space-y-6">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span>Tambah Kredit Menit AI</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Menambahkan kredit pemrosesan secara manual ke akun <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email}).
              </p>
            </div>

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">Mode Penambahan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreditMode('ADD')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      creditMode === 'ADD'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Tambah (+ Menit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditMode('SET')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      creditMode === 'SET'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Set Total Menit
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">Jumlah Menit Kredit</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2">
                {[30, 50, 100, 300].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCreditAmount(val)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 border border-white/10"
                  >
                    +{val}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdateCredits}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-black bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-300 hover:to-purple-400 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Kredit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
