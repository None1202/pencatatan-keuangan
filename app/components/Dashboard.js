"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FiUpload, FiSend, FiPlus, FiTrendingUp, FiTrendingDown, FiActivity, FiX, FiImage } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [insights, setInsights] = useState(""); // Insights state
    const [loadingInsights, setLoadingInsights] = useState(false); // Insights loading state
    const fileInputRef = useRef(null);

    // Initial dummy data or load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('finai_transactions');
        if (saved) {
            setTransactions(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('finai_transactions', JSON.stringify(transactions));
    }, [transactions]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selected);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt && !file) return;

        setLoading(true);
        const formData = new FormData();
        if (prompt) formData.append("prompt", prompt);
        if (file) formData.append("file", file);

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.error) {
                alert("Error: " + data.error);
            } else {
                // Add ID and raw Date object
                const newTransaction = {
                    id: Date.now(),
                    ...data,
                    date: data.date || new Date().toISOString().split('T')[0]
                };
                setTransactions([newTransaction, ...transactions]);
                setPrompt("");
                clearFile();
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please check your API key.");
        } finally {
            setLoading(false);
        }
    };

    // Financial Insights Function
    const generateInsights = async () => {
        if (transactions.length === 0) return;
        setLoadingInsights(true);
        try {
            const res = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions: transactions.slice(0, 50) }) // Limit context
            });
            const data = await res.json();
            if (data.insights) setInsights(data.insights);
        } catch (error) {
            console.error("Error generating insights:", error);
        } finally {
            setLoadingInsights(false);
        }
    };


    // Analytics Logic
    const income = transactions.filter(t => t.type?.toLowerCase() === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type?.toLowerCase() === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    const expensesByCategory = transactions
        .filter(t => t.type?.toLowerCase() === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const chartData = {
        labels: Object.keys(expensesByCategory),
        datasets: [
            {
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#8b5cf6', '#f43f5e', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'
                ],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#cbd5e1',
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            }
        },
        layout: {
            padding: 20
        }
    };

    return (
        <div className="container">
            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="hero-text">UangKu</h1>
                    <p>Asisten Keuangan Cerdas Anda</p>
                </div>
                <div className="flex gap-4">
                    <div className="card text-center" style={{ padding: '1rem', minWidth: '120px' }}>
                        <p className="input-label">Saldo</p>
                        <h3 className="text-gradient-primary">Rp {balance.toLocaleString()}</h3>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 content-wrapper">

                {/* Left Column: Input */}
                <div className="md:col-span-2 space-y-8">

                    {/* Input Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                    >
                        <h3 className="mb-4 flex items-center gap-2">
                            <FiPlus /> Catatan Baru
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group relative">
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    placeholder="Deskripsikan pengeluaranmu (misal: 'Makan di McD 50rb') atau upload struk..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    style={{ resize: 'none', paddingRight: '4rem' }}
                                />

                                {/* Upload Button overlay */}
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="btn btn-outline"
                                        style={{ padding: '0.5rem', borderRadius: '50%' }}
                                        title="Upload Struk atau PDF"
                                    >
                                        <FiImage size={20} />
                                    </button>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*,application/pdf"
                            />

                            {/* File Preview */}
                            <AnimatePresence>
                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 relative rounded-lg overflow-hidden border border-slate-700 inline-block bg-slate-800"
                                    >
                                        {file.type.startsWith('image/') && preview ? (
                                            <img src={preview} alt="Upload preview" style={{ maxHeight: '200px', maxWidth: '100%' }} />
                                        ) : (
                                            <div className="p-4 flex items-center gap-3 text-slate-300">
                                                <div className="bg-red-500/20 p-2 rounded text-red-400">PDF</div>
                                                <span className="text-sm font-medium">{file.name}</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={clearFile}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                                            style={{ zIndex: 10 }}
                                        >
                                            <FiX />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading || (!prompt && !file)}
                                    className="btn btn-primary w-full md:w-auto"
                                >
                                    {loading ? <div className="loader"></div> : <><FiSend /> Analisis & Tambah</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Transactions List */}
                    <div>
                        <h3 className="mb-4">Transaksi Terakhir</h3>
                        <div className="flex flex-col gap-3">
                            <AnimatePresence>
                                {transactions.length === 0 && (
                                    <p className="text-center opacity-50 py-10">Belum ada transaksi. Upload struk atau ketik catatan!</p>
                                )}
                                {transactions.map((t) => (
                                    <motion.div
                                        key={t.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="card transaction-item hover:bg-slate-800/50"
                                        style={{ padding: '1rem' }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`p-3 rounded-full ${t.type?.toLowerCase() === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-rose-500/20 text-rose-500'}`}
                                            >
                                                {t.type?.toLowerCase() === 'income' ? <FiTrendingUp /> : <FiTrendingDown />}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{t.merchant || t.summary || "Tidak Diketahui"}</h4>
                                                <p style={{ fontSize: '0.875rem' }}>{t.date} • {t.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-bold text-lg ${t.type?.toLowerCase() === 'income' ? 'text-green-400' : 'text-rose-400'}`}>
                                                {t.type?.toLowerCase() === 'income' ? '+' : '-'} Rp {t.amount?.toLocaleString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>

                {/* Right Column: Analytics */}
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card text-center p-4">
                            <p className="text-sm text-green-400 mb-1">Pemasukan</p>
                            <h4 className="text-xl">Rp {income.toLocaleString()}</h4>
                        </div>
                        <div className="card text-center p-4">
                            <p className="text-sm text-rose-400 mb-1">Pengeluaran</p>
                            <h4 className="text-xl">Rp {expense.toLocaleString()}</h4>
                        </div>
                    </div>

                    {/* Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                    >
                        <h3 className="mb-4 flex items-center gap-2"><FiActivity /> Rincian Pengeluaran</h3>
                        {Object.keys(expensesByCategory).length > 0 ? (
                            <div className="relative h-64 w-full flex justify-center">
                                <Doughnut data={chartData} options={chartOptions} />
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-500">
                                Belum ada data pengeluaran
                            </div>
                        )}
                    </motion.div>

                    {/* AI Insights */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="flex items-center gap-2">
                                Analisis Keuangan AI
                            </h3>
                            <button
                                onClick={generateInsights}
                                disabled={loadingInsights || transactions.length === 0}
                                className="text-sm text-primary hover:text-white transition-colors"
                            >
                                {loadingInsights ? "Berpikir..." : "Perbarui"}
                            </button>
                        </div>

                        {insights ? (
                            <div className="prose prose-invert prose-sm">
                                <div style={{ whiteSpace: 'pre-line', color: '#cbd5e1' }}>
                                    {insights}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 py-6">
                                {transactions.length > 0
                                    ? "Klik Perbarui untuk analisa AI."
                                    : "Tambah transaksi untuk membuka wawasan AI!"}
                            </div>
                        )}
                    </motion.div>
                </div>

            </div>

            {/* Footer */}
            <footer className="mt-20 text-center text-slate-500 text-sm pb-8">
                &copy; {new Date().getFullYear()} UangKu by Ghina.
            </footer>
        </div>
    );
}
