import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Brain,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  TrendingUp,
  Cpu,
  HelpCircle,
  FileText,
  AlertTriangle,
  Play
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const TECHNOLOGIES = [
  { id: 'React', name: 'React.js', color: 'from-cyan-500 to-blue-500', desc: 'Hooks, Virtual DOM, RSCs, Lifecycle' },
  { id: 'Node.js', name: 'Node.js', color: 'from-green-500 to-emerald-600', desc: 'Event Loop, EventEmitters, Streams, Libuv' },
  { id: 'JavaScript', name: 'JavaScript', color: 'from-yellow-400 to-amber-500', desc: 'Closures, Prototypes, Event Loop, ES6+' },
  { id: 'Python', name: 'Python', color: 'from-blue-600 to-indigo-500', desc: 'Decorators, OOP, Data Structures, Flask' },
  { id: 'Java', name: 'Java', color: 'from-red-500 to-orange-500', desc: 'Multithreading, JVM, OOP, Spring Boot' },
  { id: 'SQL', name: 'SQL Database', color: 'from-purple-500 to-pink-500', desc: 'Joins, Indexes, Query Optimizations, ACID' },
  { id: 'DevOps', name: 'DevOps', color: 'from-teal-500 to-cyan-500', desc: 'CI/CD, Docker, Kubernetes, AWS Cloud' }
];

const DIFFICULTIES = [
  { id: 'Beginner', label: 'Beginner', level: 'Lvl 1', desc: 'Core syntax, fundamental mechanics & basic operations' },
  { id: 'Intermediate', label: 'Intermediate', level: 'Lvl 2', desc: 'Standard usage patterns, frameworks & system features' },
  { id: 'Advanced', label: 'Advanced', level: 'Lvl 3', desc: 'Internal architectures, performance tuning & edge cases' }
];

const Dashboard = () => {
  const { apiUrl } = useAuth();
  const navigate = useNavigate();

  // Selected config for starting new interview
  const [selectedTech, setSelectedTech] = useState('React');
  const [selectedDiff, setSelectedDiff] = useState('Intermediate');
  const [startLoading, setStartLoading] = useState(false);

  // Dashboard Stats & History
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, historyRes] = await Promise.all([
        axios.get(`${apiUrl}/interviews/analytics/dashboard`),
        axios.get(`${apiUrl}/interviews/history`)
      ]);

      setAnalytics(analyticsRes.data.summary);
      setHistory(historyRes.data.interviews);
      setError('');
    } catch (err) {
      setError('Could not retrieve dashboard metrics. Please check your backend connections.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    setStartLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/interviews/start`, {
        technology: selectedTech,
        difficulty: selectedDiff
      });
      const { interviewId } = res.data;
      navigate(`/interview/${interviewId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start interview session');
    } finally {
      setStartLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse dark:bg-darkBg transition-colors duration-300">
        <div className="h-10 bg-slate-300 dark:bg-slate-800 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Formatting difficulty distribution for Pie Chart
  const pieData = analytics?.difficultyDistribution ? Object.keys(analytics.difficultyDistribution)
    .filter(key => analytics.difficultyDistribution[key] > 0)
    .map(key => ({
      name: key,
      value: analytics.difficultyDistribution[key]
    })) : [];

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 transition-colors duration-300 dark:bg-darkBg bg-lightBg min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-darkBorder border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
            Interview Prep Center
          </h1>
          <p className="mt-1.5 text-sm dark:text-slate-400 text-slate-500">
            Track performance metrics, review historical attempts, and practice technical questions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Interviews Card */}
        <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder relative overflow-hidden group">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                Total Attempts
              </p>
              <h3 className="text-4xl font-extrabold mt-2 dark:text-white text-slate-900">
                {analytics?.totalCompleted || 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-500">
              <Brain className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </div>

        {/* Average Score Card */}
        <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder relative overflow-hidden group">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                Avg. Platform Score
              </p>
              <h3 className="text-4xl font-extrabold mt-2 dark:text-white text-slate-900">
                {analytics?.averageScore || 0}%
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </div>

        {/* Tech Proficiency Summary */}
        <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder relative overflow-hidden group">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                Active Frameworks
              </p>
              <h3 className="text-4xl font-extrabold mt-2 dark:text-white text-slate-900">
                {analytics?.techScores?.length || 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </div>
      </div>

      {/* Start Interview Wizard Section */}
      <div className="p-6 md:p-8 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder glow-indigo">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
          Configure New AI Interview
        </h2>

        {/* Tech Grid */}
        <div className="space-y-6">
          <div>
            <span className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-3">
              1. Choose Technology Profile
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {TECHNOLOGIES.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => setSelectedTech(tech.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                    selectedTech === tech.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 scale-[1.02]'
                      : 'dark:border-darkBorder dark:bg-darkBg dark:text-slate-400 dark:hover:bg-slate-800 bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-bold">{tech.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Cards */}
          <div>
            <span className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-3">
              2. Select Experience Tier
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setSelectedDiff(diff.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedDiff === diff.id
                      ? 'border-indigo-500 bg-indigo-500/10 glow-indigo'
                      : 'dark:border-darkBorder dark:bg-darkBg bg-white border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-bold dark:text-white text-slate-800">{diff.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      selectedDiff === diff.id ? 'bg-indigo-500/20 text-indigo-400' : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600'
                    }`}>{diff.level}</span>
                  </div>
                  <p className="mt-2 text-xs dark:text-slate-400 text-slate-500 leading-relaxed">
                    {diff.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t dark:border-darkBorder border-slate-100">
            <button
              onClick={handleStartInterview}
              disabled={startLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Start AI Interview Session
                  <Play className="w-4 h-4 fill-white" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      {analytics?.scoreHistory?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progress Timeline Chart */}
          <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder">
            <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Evaluation History Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131926',
                      borderColor: '#1f293d',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tech Breakdown Chart */}
          <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder">
            <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              Proficiency by Technology
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.techScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="technology" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131926',
                      borderColor: '#1f293d',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]}>
                    {analytics.techScores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder">
        <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          Attempt Logs & Analytics Reports
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-12 border border-dashed dark:border-darkBorder border-slate-200 rounded-xl">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-bounce" />
            <p className="text-sm font-semibold dark:text-slate-200 text-slate-800">No attempts logged yet</p>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-1 max-w-xs mx-auto">
              Configure and run an interview session above to generate performance metrics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y dark:divide-darkBorder divide-slate-100">
              <thead>
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                    Technology
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                    Difficulty
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                    Attempt Date
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                    AI Score
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-darkBorder divide-slate-100">
                {history.map((interview) => (
                  <tr key={interview._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold dark:text-white text-slate-900">
                      {interview.technology}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-700">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200">
                        {interview.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-400 text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(interview.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getScoreColor(interview.overallFeedback?.score || 0)}`}>
                        {interview.overallFeedback?.score || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        to={`/history/${interview._id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
                      >
                        Review Report
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
