import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  LineChart, Line, Legend
} from 'recharts';
import { api } from '../services/api';
import '../styles/Analytics.css';

// ─── WhatsApp brand palette ───────────────────────────────────────────────────
const WA_GREEN    = '#25D366';
const WA_DARK     = '#075E54';
const WA_MID      = '#128C7E';

// ─── Format helpers ───────────────────────────────────────────────────────────
const formatHour = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${suffix}`;
};

const fmtMs = (ms) => {
  if (!ms || ms === 0) return '0ms';
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
  if (ms >= 1000)  return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
};

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target || target === 0) { setCount(0); return; }
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, unit, color = WA_MID, index = 0, sub, onClick, active }) => {
  const numeric  = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNum    = !isNaN(numeric) && typeof value !== 'string';
  const animated = useCountUp(isNum ? numeric : 0);
  const shown    = isNum
    ? (Number.isInteger(numeric) ? animated : numeric.toFixed(1))
    : value;

  return (
    <div
      className={`wa-stat-card ${onClick ? 'clickable' : ''} ${active ? 'active' : ''}`}
      style={{ '--card-color': color, animationDelay: `${index * 70}ms` }}
      onClick={onClick}
    >
      <div className="wa-stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="wa-stat-body">
        <span className="wa-stat-label">{label}</span>
        <div className="wa-stat-value-row">
          <span className="wa-stat-value" style={{ color }}>{shown}</span>
          {unit && <span className="wa-stat-unit">{unit}</span>}
        </div>
        {sub && <span className="wa-stat-sub">{sub}</span>}
      </div>
      <div className="wa-stat-bar" style={{ background: color }} />
      {onClick && <span className="wa-stat-drill-hint">{active ? '▲' : '▼'}</span>}
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, icon, children, className = '', badge }) => (
  <div className={`wa-section ${className}`}>
    <div className="wa-section-header">
      <span className="wa-section-icon">{icon}</span>
      <h2>{title}</h2>
      {badge && <span className="wa-section-badge">{badge}</span>}
    </div>
    {children}
  </div>
);

// ─── Recharts custom tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="wa-tooltip">
      <p className="wa-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#25D366', margin: '2px 0' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Loading state ────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="wa-loading-overlay">
    <div className="wa-spinner">
      <div className="wa-spinner-ring" />
      <span className="wa-spinner-icon">📊</span>
    </div>
    <p>Loading analytics…</p>
  </div>
);

// ─── Empty chart placeholder ──────────────────────────────────────────────────
const EmptyChart = ({ msg = 'No data yet' }) => (
  <div className="wa-empty-chart">
    <span>📭</span>
    <p>{msg}</p>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// Main Analytics Component
// ════════════════════════════════════════════════════════════════════════════
export default function Analytics() {
  const [metrics,         setMetrics]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [error,           setError]           = useState(null);
  const [lastUpdated,     setLastUpdated]     = useState(null);
  const [activeCategory,  setActiveCategory]  = useState(() => {
    return sessionStorage.getItem('wa_analytics_active_tab') || 'overview';
  });
  const [expandedSection, setExpandedSection] = useState(null);

  // ── unwrap helper – every API response is { success, data, timestamp } ──
  const unwrap = (res) => res?.data ?? res;

  const fetchAll = useCallback(async (isRefresh = false) => {
    const startTime = Date.now();
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        api.getDailyActiveUsers(),
        api.getWeeklyActiveUsers(),
        api.getQuestionsServed(),
        api.getQuestionsAnswered(),
        api.getAvgResponseTime(),
        api.getCompletionRate(),
        api.getDropOff(),
        api.getPeakHours(),
        api.getAvgQuestionsPerSession(),
        // Performance drill-down
        api.getSubjectServed(),
        api.getChapterServed(),
        api.getExamServed(),
        api.getDifficultyServed(),
        api.getSubjectAccuracy(),
        api.getChapterAccuracy(),
      ]);

      const getValue = (p, fallback = null) => {
        if (p.status === 'fulfilled') return unwrap(p.value);
        console.warn('Failed to fetch metric:', p.reason);
        return fallback;
      };

      const dauArr         = getValue(results[0],  []);
      const wauArr         = getValue(results[1],  []);
      const served         = getValue(results[2],  {});
      const answered       = getValue(results[3],  {});
      const avgTimeObj     = getValue(results[4],  {});
      const completion     = getValue(results[5],  {});
      const dropoffArr     = getValue(results[6],  []);
      const peakArr        = getValue(results[7],  []);
      const avgQObj        = getValue(results[8],  {});
      const subjectServed  = getValue(results[9],  []);
      const chapterServed  = getValue(results[10], []);
      const examServed     = getValue(results[11], []);
      const diffServed     = getValue(results[12], []);
      const subjectAcc     = getValue(results[13], []);
      const chapterAcc     = getValue(results[14], []);

      // ── DAU ──────────────────────────────────────────────────────────────
      const dauToday = Array.isArray(dauArr) && dauArr.length > 0
        ? dauArr[dauArr.length - 1]?.active_users ?? 0 : 0;
      const dauChart = Array.isArray(dauArr)
        ? dauArr.slice(-14).map(d => ({ date: d.date ? d.date.slice(5) : '', users: d.active_users ?? 0 }))
        : [];

      // ── WAU ──────────────────────────────────────────────────────────────
      const wauTotal = Array.isArray(wauArr)
        ? wauArr.reduce((acc, w) => acc + (w.active_users ?? 0), 0) : 0;
      const wauChart = Array.isArray(wauArr)
        ? wauArr.map(w => ({ week: w.week, users: w.active_users ?? 0 })) : [];
      wauChart.sort((a, b) => {
        const numA = parseInt(String(a.week).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.week).replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      // ── Peak hours ───────────────────────────────────────────────────────
      const hourGrid = Array.from({ length: 24 }, (_, h) => ({ label: formatHour(h), h, activity: 0 }));
      if (Array.isArray(peakArr)) {
        peakArr.forEach(({ hour, activity }) => {
          if (hour >= 0 && hour < 24) hourGrid[hour].activity = activity ?? 0;
        });
      }
      const peakHourObj = hourGrid.reduce((mx, x) => (x.activity > mx.activity ? x : mx), hourGrid[0]);

      // ── Normalize drill-down arrays ───────────────────────────────────────
      const normSubjectServed  = Array.isArray(subjectServed)  ? subjectServed  : [];
      const normChapterServed  = Array.isArray(chapterServed)  ? chapterServed  : [];
      const normExamServed     = Array.isArray(examServed)     ? examServed     : [];
      const normDiffServed     = Array.isArray(diffServed)     ? diffServed     : [];
      const normSubjectAcc     = Array.isArray(subjectAcc)     ? subjectAcc     : [];
      const normChapterAcc     = Array.isArray(chapterAcc)     ? chapterAcc     : [];

      setMetrics({
        dauToday, wauTotal, dauChart, wauChart, hourGrid,
        peakHour: peakHourObj.h,
        served:            served?.total_questions_served  ?? 0,
        servedToday:       served?.total_today             ?? 0,
        answered:          answered?.total_answered        ?? 0,
        correct:           answered?.correct               ?? 0,
        accuracy:          answered?.accuracy              ?? 0,
        avgTime:           avgTimeObj?.average_response_time_ms ?? 0,
        completion:        completion?.completion_rate_percent  ?? 0,
        totalSessions:     completion?.total_sessions     ?? 0,
        completedSessions: completion?.completed_sessions ?? 0,
        avgQ:              avgQObj?.average_questions      ?? 0,
        dropoff:           Array.isArray(dropoffArr) ? dropoffArr : [],
        answerRate: (served?.total_questions_served ?? 0) > 0
          ? (((answered?.total_answered ?? 0) / (served?.total_questions_served ?? 1)) * 100).toFixed(1)
          : '0.0',
        // Drill-down
        subjectServed:  normSubjectServed,
        chapterServed:  normChapterServed,
        examServed:     normExamServed,
        difficultyServed: normDiffServed,
        subjectAccuracy:  normSubjectAcc,
        chapterAccuracy:  normChapterAcc,
      });

      // Enforce a minimum visual delay of 800ms for refreshes so they are satisfying and obvious
      const elapsed = Date.now() - startTime;
      const minDelay = 800;
      if (isRefresh && elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics. Is the backend running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(false); }, [fetchAll]);

  if (error && !metrics) {
    return (
      <div className="wa-analytics">
        <div className="container">
          <div className="wa-error-card">
            <div className="wa-error-icon">⚠️</div>
            <h2>Couldn't load analytics</h2>
            <p>{error}</p>
            <button className="wa-btn-primary" onClick={() => fetchAll(false)}>🔄 Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="wa-analytics"><div className="container"><LoadingScreen /></div></div>
  );

  const m = metrics;

  // Donut data
  const answerPct   = parseFloat(m.answerRate);
  const donutData   = [
    { name: 'Answered', value: answerPct },
    { name: 'Pending',  value: Math.max(0, 100 - answerPct) },
  ];
  const DONUT_COLORS = [WA_GREEN, '#E8E8E8'];
  const accData = [
    { name: 'Correct',   value: m.accuracy },
    { name: 'Incorrect', value: Math.max(0, 100 - m.accuracy) },
  ];
  const ACC_COLORS = ['#128C7E', '#EF4444'];

  const chartHours  = m.hourGrid;

  // Drill-down derived values
  const mostServedChapter = m.chapterServed.length > 0
    ? m.chapterServed.reduce((mx, c) => c.count > mx.count ? c : mx, m.chapterServed[0])?.chapter : 'N/A';
  const leastServedChapter = m.chapterServed.length > 0
    ? m.chapterServed.reduce((mn, c) => c.count < mn.count ? c : mn, m.chapterServed[0])?.chapter : 'N/A';
  const strongestSubject = m.subjectAccuracy.length > 0
    ? m.subjectAccuracy.reduce((mx, s) => s.accuracy > mx.accuracy ? s : mx, m.subjectAccuracy[0]) : null;
  const weakestSubject = m.subjectAccuracy.length > 0
    ? m.subjectAccuracy.reduce((mn, s) => s.accuracy < mn.accuracy ? s : mn, m.subjectAccuracy[0]) : null;
  const highestIncorrectChapter = m.chapterAccuracy.length > 0
    ? m.chapterAccuracy.reduce((mx, c) => c.incorrect > mx.incorrect ? c : mx, m.chapterAccuracy[0]) : null;

  return (
    <div className="wa-analytics">
      <div className="container">

        {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
        <div className="wa-header">
          <div className="wa-header-brand">
            <div className="wa-header-logo">📊</div>
            <div>
              <h1>Analytics Dashboard</h1>
              <p className="wa-header-sub">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Real-time insights'}
              </p>
            </div>
          </div>
          <div className="wa-header-actions">
            {error && <span className="wa-warning-badge">⚠ Partial data</span>}
            <div className="wa-live-badge">
              <span className="wa-live-dot" />
              LIVE
            </div>
            <button
              className="wa-btn-refresh"
              onClick={() => window.location.reload()}
              id="analytics-refresh-btn"
            >
              <svg 
                className="wa-refresh-svg"
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ═══ CATEGORY NAVIGATION ══════════════════════════════════════════ */}
        <div className="wa-analytics-cat-nav">
          {[
            { id: 'overview',    icon: '📊', label: 'Traffic Overview' },
            { id: 'performance', icon: '🎯', label: 'Academic Performance' },
            { id: 'retention',   icon: '📉', label: 'Friction & Retention' },
          ].map(cat => (
            <button
              key={cat.id}
              className={`wa-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => { 
                setActiveCategory(cat.id); 
                sessionStorage.setItem('wa_analytics_active_tab', cat.id);
                setExpandedSection(null); 
              }}
            >
              <span className="wa-cat-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* ─── CATEGORY A: OVERVIEW ─────────────────────────────────────── */}
        {activeCategory === 'overview' && (
          <div className="wa-panel-anim">

            <div className="wa-stats-grid">
              <StatCard index={0} icon="👥" label="Daily Active Users"
                value={m.dauToday} unit="users today" color={WA_DARK} />
              <StatCard index={1} icon="📈" label="Weekly Active Users"
                value={m.wauTotal} unit="users/week" color={WA_MID} />
              <StatCard index={2} icon="🎯" label="Completion Rate"
                value={m.completion} unit="%" color="#F4A261"
                sub={`${m.completedSessions} / ${m.totalSessions} sessions`} />
              <StatCard index={3} icon="⏰" label="Peak Hour"
                value={formatHour(m.peakHour)} unit="" color="#A8DADC" />
            </div>

            {/* DAU Trend (Full Width) */}
            <div className="wa-charts-row">
              <Section icon="👥" title="Daily Active Users (Last 14 Days)"
                className="wa-section-full"
                badge={`Today: ${m.dauToday}`}>
                {m.dauChart.length === 0
                  ? <EmptyChart msg="No daily data yet" />
                  : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={m.dauChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={WA_GREEN} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={WA_GREEN} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="users" name="Active Users"
                          stroke={WA_GREEN} strokeWidth={2.5}
                          fill="url(#dauGrad)" dot={false} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                }
              </Section>
            </div>

            {/* Peak Hours Trend (Full Width) */}
            <div className="wa-charts-row">
              <Section icon="⏰" title="Activity by Hour"
                className="wa-section-full"
                badge={`Peak: ${formatHour(m.peakHour)}`}>
                {chartHours.every(h => h.activity === 0)
                  ? <EmptyChart msg="No hourly activity data yet" />
                  : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartHours} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Bar dataKey="activity" name="Sessions" radius={[4, 4, 0, 0]} barSize={28}>
                          {chartHours.map((entry, i) => (
                            <Cell key={i}
                              fill={entry.h === m.peakHour ? '#128C7E' : '#80cbc4'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )
                }
              </Section>
            </div>

            {/* Weekly Trend */}
            {m.wauChart.length > 0 && (
              <Section icon="📈" title="Weekly Active Users Trend" className="wa-section-full">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={m.wauChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="users" name="Active Users" fill="#128C7E" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            )}



          </div>
        )}

        {/* ─── CATEGORY B: ACADEMIC PERFORMANCE ────────────────────────── */}
        {activeCategory === 'performance' && (
          <div className="wa-panel-anim">

            <div className="wa-stats-grid">
              <StatCard index={0} icon="📚" label="Questions Served"
                value={m.served} unit="total" color="#4b5563"
                sub={`${m.servedToday.toLocaleString()} today`}
                onClick={() => setExpandedSection(expandedSection === 'served' ? null : 'served')}
                active={expandedSection === 'served'} />
              <StatCard index={1} icon="✅" label="Questions Answered"
                value={m.answered} unit="total" color={WA_MID}
                sub={`${m.correct.toLocaleString()} correct`}
                onClick={() => setExpandedSection(expandedSection === 'answered' ? null : 'answered')}
                active={expandedSection === 'answered'} />
              <StatCard index={2} icon="⏱️" label="Avg Response Time"
                value={fmtMs(m.avgTime)} unit="" color="#4b5563" />
              <StatCard index={3} icon="🧩" label="Avg Q / Session"
                value={m.avgQ} unit="questions" color="#4b5563" />
            </div>

            {/* Default State: Answer Accuracy Chart */}
            {expandedSection === null && (
              <div className="wa-panel-anim" style={{ marginTop: '20px' }}>
                <Section icon="🎯" title="Answer Accuracy Overview" className="wa-section-full"
                  badge={`${m.accuracy}% correct`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', padding: '20px 0' }}>
                    <div className="wa-donut-wrapper" style={{ margin: 0 }}>
                      <ResponsiveContainer width={240} height={210}>
                        <PieChart>
                          <Pie data={accData} cx="50%" cy="50%"
                            innerRadius={58} outerRadius={85}
                            startAngle={90} endAngle={-270}
                            dataKey="value" stroke="none">
                            {accData.map((_, i) => <Cell key={i} fill={ACC_COLORS[i]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="wa-donut-center">
                        <span className="wa-donut-pct" style={{ color: '#128C7E', fontWeight: 800 }}>{m.accuracy}%</span>
                        <span className="wa-donut-sub">accurate</span>
                      </div>
                    </div>
                    <div className="wa-donut-legend" style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="wa-legend-item" style={{ fontSize: '0.95rem' }}><span style={{ background: ACC_COLORS[0], width: '12px', height: '12px' }} /><strong>Correct answers:</strong> {m.correct.toLocaleString()}</div>
                      <div className="wa-legend-item" style={{ fontSize: '0.95rem' }}><span style={{ background: ACC_COLORS[1], width: '12px', height: '12px' }} /><strong>Wrong answers:</strong> {(m.answered - m.correct).toLocaleString()}</div>
                      <div className="wa-legend-item" style={{ fontSize: '0.95rem', color: '#6b7280' }}><span style={{ background: '#bbb', width: '12px', height: '12px' }} /><strong>Total evaluated:</strong> {m.answered.toLocaleString()}</div>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {/* Drill-Down: Questions Served */}
            {expandedSection === 'served' && (
              <div className="wa-drilldown-panel served wa-panel-anim">
                <div className="wa-drilldown-header">
                  <span className="wa-dd-icon">📚</span>
                  <div>
                    <h3>Questions Served — Detailed Breakdown</h3>
                    <p>Granular distribution across subjects, chapters, exams, and difficulty tiers.</p>
                  </div>
                  <button className="wa-dd-close" onClick={() => setExpandedSection(null)}>✕</button>
                </div>
                <div className="wa-dd-summary-strip">
                  <div className="wa-dd-summary-card"><span>🔥 Most Served Chapter</span><strong>{mostServedChapter}</strong></div>
                  <div className="wa-dd-summary-card"><span>❄️ Least Served Chapter</span><strong>{leastServedChapter}</strong></div>
                  <div className="wa-dd-summary-card"><span>📅 Served Today</span><strong>{m.servedToday.toLocaleString()} questions</strong></div>
                </div>
                <div className="wa-dd-grid-four">
                  <div className="wa-dd-col">
                    <h4>By Subject</h4>
                    <div className="wa-dd-list">
                      {m.subjectServed.map((s, i) => (
                        <div key={i} className="wa-dd-row">
                          <span className="wa-dd-name">{s.subject}</span>
                          <div className="wa-dd-bar-container"><div className="wa-dd-bar" style={{ width: `${(s.count / (m.served || 1)) * 100}%`, backgroundColor: '#128C7E' }} /></div>
                          <span className="wa-dd-val">{s.count}</span>
                        </div>
                      ))}
                      {m.subjectServed.length === 0 && <p className="wa-dd-empty">No data</p>}
                    </div>
                  </div>
                  <div className="wa-dd-col">
                    <h4>Top Chapters</h4>
                    <div className="wa-dd-list scrollable">
                      {m.chapterServed.slice(0, 5).map((c, i) => (
                        <div key={i} className="wa-dd-row">
                          <span className="wa-dd-name" title={c.chapter}>{c.chapter}</span>
                          <span className="wa-dd-val"><strong>{c.count}</strong></span>
                        </div>
                      ))}
                      {m.chapterServed.length === 0 && <p className="wa-dd-empty">No data</p>}
                    </div>
                  </div>
                  <div className="wa-dd-col">
                    <h4>By Exam</h4>
                    <div className="wa-dd-list">
                      {m.examServed.map((e, i) => (
                        <div key={i} className="wa-dd-row">
                          <span className="wa-dd-name">{e.exam}</span>
                          <div className="wa-dd-bar-container"><div className="wa-dd-bar" style={{ width: `${(e.count / (m.served || 1)) * 100}%`, backgroundColor: '#25D366' }} /></div>
                          <span className="wa-dd-val">{e.count}</span>
                        </div>
                      ))}
                      {m.examServed.length === 0 && <p className="wa-dd-empty">No data</p>}
                    </div>
                  </div>
                  <div className="wa-dd-col">
                    <h4>Difficulty</h4>
                    <div className="wa-dd-list">
                      {m.difficultyServed.map((d, i) => {
                        const dc = { easy: '#25D366', medium: '#fbbf24', hard: '#E53935' };
                        const pct = ((d.count / (m.served || 1)) * 100).toFixed(0);
                        return (
                          <div key={i} className="wa-dd-row">
                            <span className="wa-dd-name capitalized">{d.difficulty}</span>
                            <div className="wa-dd-bar-container"><div className="wa-dd-bar" style={{ width: `${pct}%`, backgroundColor: dc[d.difficulty] || '#128C7E' }} /></div>
                            <span className="wa-dd-val">{d.count}</span>
                          </div>
                        );
                      })}
                      {m.difficultyServed.length === 0 && <p className="wa-dd-empty">No data</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drill-Down: Questions Answered */}
            {expandedSection === 'answered' && (
              <div className="wa-drilldown-panel answered wa-panel-anim">
                <div className="wa-drilldown-header">
                  <span className="wa-dd-icon">✅</span>
                  <div>
                    <h3>Accuracy Deep Dive</h3>
                    <p>Subject accuracy breakdown across all exam sessions.</p>
                  </div>
                  <button className="wa-dd-close" onClick={() => setExpandedSection(null)}>✕</button>
                </div>
                <div className="wa-dd-summary-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="wa-dd-summary-card"><span>💪 Strongest Subject</span><strong>{strongestSubject ? `${strongestSubject.subject} (${strongestSubject.accuracy.toFixed(1)}%)` : 'N/A'}</strong></div>
                  <div className="wa-dd-summary-card"><span>⚠️ Weakest Subject</span><strong>{weakestSubject ? `${weakestSubject.subject} (${weakestSubject.accuracy.toFixed(1)}%)` : 'N/A'}</strong></div>
                </div>
                <div className="wa-dd-grid-two" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="wa-dd-col">
                    <h4>Subject Accuracy</h4>
                    <div className="wa-dd-table-wrapper">
                      <table className="wa-dd-table">
                        <thead><tr><th>Subject</th><th style={{ textAlign: 'center' }}>Total</th><th style={{ textAlign: 'center' }}>✓ / ✗</th><th style={{ textAlign: 'right' }}>Accuracy</th></tr></thead>
                        <tbody>
                          {m.subjectAccuracy.map((s, i) => (
                            <tr key={i}>
                              <td><strong>{s.subject}</strong></td>
                              <td style={{ textAlign: 'center' }}>{s.total}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ color: '#2E7D32', fontWeight: 600 }}>{s.correct}</span>
                                <span style={{ color: '#bbb' }}> / </span>
                                <span style={{ color: '#C62828', fontWeight: 600 }}>{s.incorrect}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`wa-dd-acc-badge ${s.accuracy >= 70 ? 'acc-high' : s.accuracy >= 40 ? 'acc-mid' : 'acc-low'}`}>{s.accuracy.toFixed(1)}%</span>
                              </td>
                            </tr>
                          ))}
                          {m.subjectAccuracy.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '16px' }}>No stats yet</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ─── CATEGORY C: FRICTION & RETENTION ────────────────────────── */}
        {activeCategory === 'retention' && (
          <div className="wa-panel-anim">
            <div className="wa-charts-row">
              <Section icon="🎯" title="Session Completion" className="wa-chart-section">
                {(() => {
                  const pct      = Math.min(m.completion, 100);
                  const r        = 72;
                  const cx       = 110;
                  const cy       = 110;
                  const circ     = 2 * Math.PI * r;
                  const filled   = (pct / 100) * circ;
                  const dropped  = m.totalSessions - m.completedSessions;
                  const color    = pct >= 75 ? WA_GREEN : pct >= 50 ? '#F4A261' : '#E53935';
                  return (
                    <div className="wa-ring-wrapper">
                      <svg width="220" height="220" viewBox="0 0 220 220">
                        {/* Track */}
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="18" />
                        {/* Progress arc */}
                        <circle
                          cx={cx} cy={cy} r={r} fill="none"
                          stroke={color} strokeWidth="18"
                          strokeLinecap="round"
                          strokeDasharray={`${filled} ${circ}`}
                          strokeDashoffset={circ * 0.25}
                          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)', transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
                        />
                        {/* Center text */}
                        <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="26" fontWeight="800" fontFamily="inherit">
                          {pct.toFixed(0)}%
                        </text>
                        <text x={cx} y={cy + 14} textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="500" fontFamily="inherit">
                          completion rate
                        </text>
                      </svg>

                      <div className="wa-ring-stats">
                        <div className="wa-ring-stat">
                          <span className="wa-ring-stat-dot" style={{ background: WA_GREEN }} />
                          <div>
                            <strong style={{ color: WA_DARK }}>{m.completedSessions.toLocaleString()}</strong>
                            <span>Completed</span>
                          </div>
                        </div>
                        <div className="wa-ring-stat">
                          <span className="wa-ring-stat-dot" style={{ background: '#E53935' }} />
                          <div>
                            <strong style={{ color: '#c0392b' }}>{dropped.toLocaleString()}</strong>
                            <span>Dropped</span>
                          </div>
                        </div>
                        <div className="wa-ring-stat">
                          <span className="wa-ring-stat-dot" style={{ background: '#9ca3af' }} />
                          <div>
                            <strong>{m.totalSessions.toLocaleString()}</strong>
                            <span>Total Sessions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Section>

              <Section 
                icon="📉" 
                title="Drop-off by Question" 
                className="wa-chart-section grow-2"
                badge={`Total Starts: ${m.totalSessions}`}
              >
                {m.dropoff.length === 0
                  ? <EmptyChart msg="No drop-off data yet — users are finishing quizzes!" />
                  : (
                    <div className="wa-funnel">
                      <div className="wa-funnel-header">
                        <span>Question</span>
                        <span>Reached</span>
                        <span>Drop-off Rate</span>
                      </div>
                      
                      {/* Baseline Total Reference Row */}
                      <div className="wa-funnel-row wa-funnel-baseline">
                        <div>
                          <span className="wa-funnel-badge" style={{ background: '#7f8c8d' }}>
                            Starts
                          </span>
                        </div>
                        <div className="wa-funnel-users">{(m.totalSessions ?? 0).toLocaleString()}</div>
                        <div className="wa-funnel-bar-wrap">
                          <span className="wa-funnel-baseline-desc">
                            Baseline Reference (100% of Sessions)
                          </span>
                        </div>
                      </div>

                      {m.dropoff.slice(0, 10).map((item, idx) => {
                        const pct   = Math.min(item.drop_off_percent ?? 0, 100);
                        const color = pct > 40 ? '#E53935' : pct > 20 ? '#FF9800' : WA_GREEN;
                        return (
                          <div key={idx} className="wa-funnel-row">
                            <div>
                              <span className="wa-funnel-badge"
                                style={{ background: `linear-gradient(135deg, ${WA_DARK}, ${WA_GREEN})` }}>
                                Q{item.question_number ?? idx + 1}
                              </span>
                            </div>
                            <div className="wa-funnel-users">{(item.users_reached ?? 0).toLocaleString()}</div>
                            <div className="wa-funnel-bar-wrap">
                              <div className="wa-funnel-bar-bg">
                                <div className="wa-funnel-bar-fill" style={{ width: `${pct}%`, background: color }} />
                              </div>
                              <span className="wa-funnel-pct" style={{ color }}>{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                }
              </Section>
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
        <div className="wa-footer">
          <div className="wa-footer-dot" />
          <p>Analytics updates in real-time as users take quizzes</p>
          {lastUpdated && <span>· Last refresh: {lastUpdated.toLocaleTimeString()}</span>}
        </div>

      </div>
    </div>
  );
}
