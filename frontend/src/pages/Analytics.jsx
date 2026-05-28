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
const StatCard = ({ icon, label, value, unit, color = WA_MID, index = 0, sub }) => {
  const numeric  = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNum    = !isNaN(numeric) && typeof value !== 'string';
  const animated = useCountUp(isNum ? numeric : 0);
  const shown    = isNum
    ? (Number.isInteger(numeric) ? animated : numeric.toFixed(1))
    : value;

  return (
    <div className="wa-stat-card" style={{ '--card-color': color, animationDelay: `${index * 70}ms` }}>
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
  <div className="wa-loading-screen">
    <div className="wa-spinner-wrap">
      <div className="wa-spinner-ring" />
      <span className="wa-spinner-emoji">📊</span>
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
  const [metrics,     setMetrics]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── unwrap helper – every API response is { success, data, timestamp } ──
  const unwrap = (res) => res?.data ?? res;

  const fetchAll = useCallback(async (isRefresh = false) => {
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
      ]);

      const getValue = (p, fallback = null) => {
        if (p.status === 'fulfilled') {
          return unwrap(p.value);
        }
        console.warn('Failed to fetch metric:', p.reason);
        return fallback;
      };

      // ── Unwrap the { success, data } envelope safely ───────────────────
      const dauArr      = getValue(results[0], []);      // array of { date, active_users }
      const wauArr      = getValue(results[1], []);      // array of { week, active_users }
      const served      = getValue(results[2], {});      // { total_questions_served, total_today, average_per_session }
      const answered    = getValue(results[3], {});      // { total_answered, correct, incorrect, accuracy }
      const avgTimeObj  = getValue(results[4], {});      // { average_response_time_ms, ... }
      const completion  = getValue(results[5], {});      // { completion_rate_percent, total_sessions, completed_sessions }
      const dropoffArr  = getValue(results[6], []);      // array of { question_number, users_reached, drop_off_percent }
      const peakArr     = getValue(results[7], []);      // array of { hour: 0-23, activity: n }
      const avgQObj     = getValue(results[8], {});      // { average_questions, min_questions, max_questions }

      // ── DAU: today's count = last entry in the daily array ──────────────
      const dauToday = Array.isArray(dauArr) && dauArr.length > 0
        ? dauArr[dauArr.length - 1]?.active_users ?? 0
        : 0;

      // ── DAU chart: last 14 days ──────────────────────────────────────────
      const dauChart = Array.isArray(dauArr)
        ? dauArr.slice(-14).map(d => ({
            date: d.date ? d.date.slice(5) : '',   // MM-DD
            users: d.active_users ?? 0
          }))
        : [];

      // ── WAU: sum of active_users across weeks ────────────────────────────
      const wauTotal = Array.isArray(wauArr)
        ? wauArr.reduce((acc, w) => acc + (w.active_users ?? 0), 0)
        : 0;

      // ── WAU chart ─────────────────────────────────────────────────────────
      const wauChart = Array.isArray(wauArr)
        ? wauArr.map(w => ({ week: w.week, users: w.active_users ?? 0 }))
        : [];

      // ── Peak hours: build 24-hour grid ───────────────────────────────────
      const hourGrid = Array.from({ length: 24 }, (_, h) => ({
        label: formatHour(h), h, activity: 0
      }));
      if (Array.isArray(peakArr)) {
        peakArr.forEach(({ hour, activity }) => {
          if (hour >= 0 && hour < 24) hourGrid[hour].activity = activity ?? 0;
        });
      }
      const peakHourObj = hourGrid.reduce(
        (mx, x) => (x.activity > mx.activity ? x : mx), hourGrid[0]
      );

      setMetrics({
        // KPIs
        dauToday,
        wauTotal,
        served:      served?.total_questions_served  ?? 0,
        servedToday: served?.total_today             ?? 0,
        answered:    answered?.total_answered        ?? 0,
        correct:     answered?.correct               ?? 0,
        accuracy:    answered?.accuracy              ?? 0,
        avgTime:     avgTimeObj?.average_response_time_ms ?? 0,
        completion:  completion?.completion_rate_percent  ?? 0,
        totalSessions:    completion?.total_sessions     ?? 0,
        completedSessions:completion?.completed_sessions ?? 0,
        peakHour:    peakHourObj.h,
        avgQ:        avgQObj?.average_questions      ?? 0,
        // Charts
        dauChart,
        wauChart,
        hourGrid,
        dropoff: Array.isArray(dropoffArr) ? dropoffArr : [],
        // Derived
        answerRate: (served?.total_questions_served ?? 0) > 0
          ? (((answered?.total_answered ?? 0) / (served?.total_questions_served ?? 1)) * 100).toFixed(1)
          : '0.0',
      });

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

  // ── Error ──────────────────────────────────────────────────────────────────
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="wa-analytics"><div className="container"><LoadingScreen /></div></div>
  );

  const m = metrics;

  // Donut – answer rate
  const answerPct   = parseFloat(m.answerRate);
  const donutData   = [
    { name: 'Answered', value: answerPct },
    { name: 'Pending',  value: Math.max(0, 100 - answerPct) },
  ];
  const DONUT_COLORS = [WA_GREEN, '#E8E8E8'];

  // Accuracy donut
  const accData = [
    { name: 'Correct',   value: m.accuracy },
    { name: 'Incorrect', value: Math.max(0, 100 - m.accuracy) },
  ];
  const ACC_COLORS = ['#6C63FF', '#E8E8E8'];

  // Peak hours – show only hours with activity or all if all zero
  const activeHours = m.hourGrid.filter(h => h.activity > 0);
  const chartHours  = activeHours.length ? activeHours : m.hourGrid;

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
              className={`wa-btn-refresh ${refreshing ? 'spinning' : ''}`}
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              id="analytics-refresh-btn"
            >
              <span className="wa-refresh-icon">🔄</span>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ═══ KPI ROW 1 ════════════════════════════════════════════════════ */}
        <div className="wa-stats-grid">
          <StatCard index={0} icon="👥" label="Daily Active Users"
            value={m.dauToday} unit="users today" color={WA_DARK} />
          <StatCard index={1} icon="📈" label="Weekly Active Users"
            value={m.wauTotal} unit="users/week" color={WA_MID} />
          <StatCard index={2} icon="📚" label="Questions Served"
            value={m.served} unit="total" color="#6C63FF"
            sub={`${m.servedToday.toLocaleString()} today`} />
          <StatCard index={3} icon="✅" label="Questions Answered"
            value={m.answered} unit="total" color={WA_GREEN}
            sub={`${m.correct.toLocaleString()} correct`} />
        </div>

        {/* ═══ KPI ROW 2 ════════════════════════════════════════════════════ */}
        <div className="wa-stats-grid" style={{ marginTop: 0 }}>
          <StatCard index={4} icon="⏱️" label="Avg Response Time"
            value={fmtMs(m.avgTime)} unit="" color="#FF6B6B" />
          <StatCard index={5} icon="🎯" label="Completion Rate"
            value={m.completion} unit="%" color="#F4A261"
            sub={`${m.completedSessions} / ${m.totalSessions} sessions`} />
          <StatCard index={6} icon="⏰" label="Peak Hour"
            value={formatHour(m.peakHour)} unit="" color="#A8DADC" />
          <StatCard index={7} icon="🧩" label="Avg Q / Session"
            value={m.avgQ} unit="questions" color="#E9C46A" />
        </div>

        {/* ═══ CHARTS ROW 1: DAU Trend + Peak Hours ════════════════════════ */}
        <div className="wa-charts-row">

          {/* Daily Active Users trend */}
          <Section icon="👥" title="Daily Active Users (Last 14 Days)"
            className="wa-chart-section grow-2"
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="users" name="Active Users"
                      stroke={WA_GREEN} strokeWidth={2.5}
                      fill="url(#dauGrad)" dot={false} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </Section>

          {/* Accuracy donut */}
          <Section icon="🎯" title="Answer Accuracy" className="wa-chart-section"
            badge={`${m.accuracy}% correct`}>
            <div className="wa-donut-wrapper">
              <ResponsiveContainer width="100%" height={210}>
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
                <span className="wa-donut-pct" style={{ color: '#6C63FF' }}>{m.accuracy}%</span>
                <span className="wa-donut-sub">accurate</span>
              </div>
            </div>
            <div className="wa-donut-legend">
              <div className="wa-legend-item"><span style={{ background: '#6C63FF' }} />Correct ({m.correct.toLocaleString()})</div>
              <div className="wa-legend-item"><span style={{ background: '#E8E8E8' }} />Wrong ({(m.answered - m.correct).toLocaleString()})</div>
            </div>
          </Section>
        </div>

        {/* ═══ CHARTS ROW 2: Peak Hours + Answer Rate ══════════════════════ */}
        <div className="wa-charts-row">

          {/* Peak Hours bar chart */}
          <Section icon="⏰" title="Activity by Hour"
            className="wa-chart-section grow-2"
            badge={`Peak: ${formatHour(m.peakHour)}`}>
            {chartHours.every(h => h.activity === 0)
              ? <EmptyChart msg="No hourly activity data yet" />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartHours} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="activity" name="Sessions" radius={[4, 4, 0, 0]}>
                      {chartHours.map((entry, i) => (
                        <Cell key={i}
                          fill={entry.h === m.peakHour ? WA_GREEN : WA_MID}
                          fillOpacity={entry.h === m.peakHour ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Section>

          {/* Answer Rate donut */}
          <Section icon="✅" title="Answer Rate" className="wa-chart-section"
            badge={`${m.answerRate}%`}>
            <div className="wa-donut-wrapper">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%"
                    innerRadius={58} outerRadius={85}
                    startAngle={90} endAngle={-270}
                    dataKey="value" stroke="none">
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="wa-donut-center">
                <span className="wa-donut-pct">{m.answerRate}%</span>
                <span className="wa-donut-sub">answered</span>
              </div>
            </div>
            <div className="wa-donut-legend">
              <div className="wa-legend-item"><span style={{ background: WA_GREEN }} />Answered ({m.answered.toLocaleString()})</div>
              <div className="wa-legend-item"><span style={{ background: '#E8E8E8' }} />Pending</div>
            </div>
          </Section>
        </div>

        {/* ═══ CHARTS ROW 3: Completion Gauge + Drop-off ═══════════════════ */}
        <div className="wa-charts-row">

          {/* Completion Gauge */}
          <Section icon="🎯" title="Session Completion" className="wa-chart-section">
            <div className="wa-gauge-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="55%"
                  innerRadius="60%" outerRadius="95%"
                  startAngle={180} endAngle={0}
                  data={[{ value: Math.min(m.completion, 100), fill: WA_GREEN }]}>
                  <RadialBar background={{ fill: '#f0f0f0' }}
                    dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="wa-gauge-center">
                <span className="wa-gauge-value">{m.completion.toFixed(1)}%</span>
                <span className="wa-gauge-label">complete</span>
              </div>
            </div>
            <div className="wa-gauge-meta">
              <div className="wa-meta-pill" style={{ background: `${WA_GREEN}20`, color: WA_DARK }}>
                ✅ {m.completedSessions.toLocaleString()} done
              </div>
              <div className="wa-meta-pill" style={{ background: '#FF6B6B20', color: '#c0392b' }}>
                ❌ {(m.totalSessions - m.completedSessions).toLocaleString()} dropped
              </div>
            </div>
          </Section>

          {/* Drop-off Funnel */}
          <Section icon="📉" title="Drop-off by Question" className="wa-chart-section grow-2">
            {m.dropoff.length === 0
              ? <EmptyChart msg="No drop-off data yet — users are finishing quizzes!" />
              : (
                <div className="wa-funnel">
                  <div className="wa-funnel-header">
                    <span>Question</span>
                    <span>Reached</span>
                    <span>Drop-off Rate</span>
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
                        <div className="wa-funnel-users">
                          {(item.users_reached ?? 0).toLocaleString()}
                        </div>
                        <div className="wa-funnel-bar-wrap">
                          <div className="wa-funnel-bar-bg">
                            <div className="wa-funnel-bar-fill"
                              style={{ width: `${pct}%`, background: color }} />
                          </div>
                          <span className="wa-funnel-pct" style={{ color }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </Section>
        </div>

        {/* ═══ WEEKLY TREND ══════════════════════════════════════════════════ */}
        {m.wauChart.length > 0 && (
          <Section icon="📈" title="Weekly Active Users Trend" className="wa-section-full">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={m.wauChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wauGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={WA_MID}  stopOpacity={0.9} />
                    <stop offset="100%" stopColor={WA_GREEN} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" name="Active Users"
                  fill="url(#wauGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}

        {/* ═══ SUMMARY STRIP ════════════════════════════════════════════════ */}
        <div className="wa-summary-row">
          <div className="wa-summary-card" style={{ '--c': WA_GREEN }}>
            <span className="wa-summary-icon">🧠</span>
            <div>
              <p className="wa-summary-val">{m.served.toLocaleString()}</p>
              <p className="wa-summary-lbl">Total questions ever served</p>
            </div>
          </div>
          <div className="wa-summary-card" style={{ '--c': '#6C63FF' }}>
            <span className="wa-summary-icon">⚡</span>
            <div>
              <p className="wa-summary-val">{fmtMs(m.avgTime)}</p>
              <p className="wa-summary-lbl">Average response time</p>
            </div>
          </div>
          <div className="wa-summary-card" style={{ '--c': '#F4A261' }}>
            <span className="wa-summary-icon">📋</span>
            <div>
              <p className="wa-summary-val">{m.avgQ.toFixed(1)}</p>
              <p className="wa-summary-lbl">Avg questions per session</p>
            </div>
          </div>
          <div className="wa-summary-card" style={{ '--c': '#FF6B6B' }}>
            <span className="wa-summary-icon">📊</span>
            <div>
              <p className="wa-summary-val">{m.totalSessions.toLocaleString()}</p>
              <p className="wa-summary-lbl">Total quiz sessions</p>
            </div>
          </div>
        </div>

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
