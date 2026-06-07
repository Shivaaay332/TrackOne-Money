import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, LabelList, ResponsiveContainer,
} from 'recharts';
import { FiPieChart, FiTrendingUp, FiTarget, FiCreditCard, FiUsers, FiCalendar } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, CATEGORY_COLORS, formatINR, formatCompactINR } from './dashboardTheme';
import MiniRing from './MiniRing';

const NO_FOCUS = `.dash-viz * { outline: none !important; -webkit-tap-highlight-color: transparent !important; }`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

const Section = ({ title, hint, icon: Icon, color, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="premium-card rounded-2xl border border-gray-100 dark:border-slate-700/80 p-4 sm:p-5"
  >
    <div className="flex items-center gap-2 mb-4">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
        <Icon size={15} />
      </span>
      <div>
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
      </div>
    </div>
    {children}
  </motion.section>
);

const AnalyticsCharts = ({ dashboardData, reportPeriod, loading }) => {
  const { isDarkMode } = useTheme();
  const data = dashboardData || {};
  const charts = data.charts || {};
  const extra = data.extraMetrics || {};
  const granularity = data.meta?.granularity || 'month';

  const axis = isDarkMode ? '#94a3b8' : '#64748b';
  const grid = isDarkMode ? '#334155' : '#e2e8f0';

  /* ── Categories ── */
  const categories = (charts.expenseByCategory || [])
    .map((item, i) => ({
      name: item.name || item.category || 'Other',
      value: Number(item.value) || Number(item.amount) || 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalCat = categories.reduce((s, c) => s + c.value, 0);

  const flowData = (charts.monthlyTrend || []).map((item) => ({
    name: item.name || item.month || '—',
    income: Number(item.income) || 0,
    expense: Number(item.expense) || 0,
  }));

  const showFlowLabels = flowData.length <= 15;

  /* ── EMI with payment history ── */
  const emiDetails = (extra.emiWithHistory || []).map(({ record: e, history }) => {
    const emiAmt = Number(e.emiAmount) || 0;
    const tenure = Number(e.tenureMonths) || 1;
    const paidCount = Number(e.paidInstallments) || 0;
    const totalPayable = emiAmt * tenure;
    const paidFromHistory = history
      .filter((h) => h.actionType === 'Paid')
      .reduce((s, h) => s + Number(h.amount), 0);
    const paidAmount = paidFromHistory > 0 ? paidFromHistory : paidCount * emiAmt;
    const remaining = Math.max(0, totalPayable - paidAmount);
    const pct = totalPayable > 0 ? (paidAmount / totalPayable) * 100 : 0;
    const payments = history
      .filter((h) => h.actionType === 'Paid')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      id: e._id,
      name: e.emiName || e.name || 'EMI',
      emiAmt,
      tenure,
      paidCount,
      remainingCount: Math.max(0, tenure - paidCount),
      paidAmount,
      remaining,
      totalPayable,
      pct,
      payments,
      status: e.status,
    };
  });

  /* ── Goals achievement ── */
  const goalDetails = (extra.goalsWithHistory || extra.goals || []).map((item) => {
    const g = item.record || item;
    const history = item.history || [];
    const target = Number(g.targetAmount) || 0;
    const saved = Number(g.currentAmount || g.savedAmount) || 0;
    const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
    const deposits = history
      .filter((h) => h.actionType === 'Added')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      id: g._id,
      name: g.goalName || g.name || 'Goal',
      target,
      saved,
      remaining: Math.max(0, target - saved),
      pct,
      deposits,
      targetMonth: g.targetMonth,
      isCompleted: g.isCompleted,
    };
  });

  /* ── Udhari payment progress per person ── */
  const udhariDetails = (extra.udhariWithHistory || []).map(({ record: u, history }) => {
    const paidActions = history.filter((h) => h.actionType === 'Received' || h.actionType === 'Paid');
    const paidAmount = paidActions.reduce((s, h) => s + Number(h.amount), 0);
    const remaining = Number(u.amount) || 0;
    const original = paidAmount + remaining;
    const pct = original > 0 ? (paidAmount / original) * 100 : 0;

    return {
      id: u._id,
      name: u.personName || 'Unknown',
      type: u.type,
      original,
      paidAmount,
      remaining,
      pct,
      payments: paidActions.sort((a, b) => new Date(b.date) - new Date(a.date)),
      isSettled: u.isSettled,
    };
  });

  const flowTitle = granularity === 'day' ? 'Roz ka Cash Flow' : 'Cash Flow Trend';

  return (
    <div className="dash-viz space-y-4">
      <style>{NO_FOCUS}</style>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="sk" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </motion.div>
        ) : (
          <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* ═══ EXPENSE: har category ka alag ring ═══ */}
            <Section
              title="Category Wise Expense"
              hint={`${categories.length} categories · kul ${formatINR(totalCat)}`}
              icon={FiPieChart}
              color={CHART_COLORS.expense}
            >
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Is period mein koi expense nahi</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map((cat, i) => {
                    const pct = totalCat > 0 ? ((cat.value / totalCat) * 100).toFixed(1) : 0;
                    return (
                      <motion.div
                        key={cat.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50"
                      >
                        <MiniRing percent={pct} color={cat.color} size={68} stroke={6} />
                        <p className="text-xs font-bold text-gray-800 dark:text-white mt-2 truncate w-full">{cat.name}</p>
                        <p className="text-sm font-black mt-0.5" style={{ color: cat.color }}>
                          {formatINR(cat.value)}
                        </p>
                        <p className="text-[10px] text-gray-400">total ka {pct}%</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* ═══ FLOW: upar-niche leti hui line + dots ═══ */}
            <Section title={flowTitle} hint="Hari line = Aaya · Laal line = Gaya · dots par amount" icon={FiTrendingUp} color={CHART_COLORS.income}>
              {flowData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Koi data nahi</p>
              ) : (
                <div className="h-[240px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={flowData} margin={{ top: 20, right: 16, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="flowIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="flowExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke={grid} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: axis, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval={granularity === 'day' && flowData.length > 12 ? Math.floor(flowData.length / 8) : 'preserveStartEnd'}
                      />
                      <YAxis
                        tick={{ fill: axis, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCompactINR(v)}
                        width={48}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Area
                        type="monotone"
                        name="Aaya (Income)"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#flowIncome)"
                        isAnimationActive
                        animationDuration={1200}
                        animationEasing="ease-out"
                        dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      >
                        {showFlowLabels && (
                          <LabelList
                            dataKey="income"
                            position="top"
                            fill="#059669"
                            fontSize={9}
                            fontWeight="bold"
                            formatter={(v) => (v > 0 ? formatCompactINR(v) : '')}
                          />
                        )}
                      </Area>
                      <Area
                        type="monotone"
                        name="Gaya (Expense)"
                        dataKey="expense"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fill="url(#flowExpense)"
                        isAnimationActive
                        animationDuration={1200}
                        animationBegin={150}
                        animationEasing="ease-out"
                        dot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                      >
                        {showFlowLabels && (
                          <LabelList
                            dataKey="expense"
                            position="bottom"
                            fill="#e11d48"
                            fontSize={9}
                            fontWeight="bold"
                            formatter={(v) => (v > 0 ? formatCompactINR(v) : '')}
                          />
                        )}
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Section>

            {/* ═══ EMI: poora payment data, vertical compact ═══ */}
            {emiDetails.length > 0 && (
              <Section
                title="EMI Payment Detail"
                hint="Kitni pay hui · kitni bachi · kab pay ki"
                icon={FiCreditCard}
                color={CHART_COLORS.emi}
              >
                <div className="space-y-3">
                  {emiDetails.map((emi, i) => (
                    <motion.div
                      key={emi.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-xl border border-gray-100 dark:border-slate-700 p-3 sm:p-4"
                    >
                      <div className="flex gap-3 items-start">
                        <MiniRing percent={emi.pct} color={CHART_COLORS.emi} size={64} stroke={6} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{emi.name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 shrink-0">
                              {emi.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-1.5 text-center">
                              <p className="text-gray-500">Pay hui</p>
                              <p className="font-bold text-emerald-600">{formatCompactINR(emi.paidAmount)}</p>
                              <p className="text-gray-400">{emi.paidCount}/{emi.tenure} EMI</p>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-1.5 text-center">
                              <p className="text-gray-500">Baaki</p>
                              <p className="font-bold text-rose-500">{formatCompactINR(emi.remaining)}</p>
                              <p className="text-gray-400">{emi.remainingCount} EMI</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
                              <p className="text-gray-500">Total</p>
                              <p className="font-bold text-gray-800 dark:text-white">{formatCompactINR(emi.totalPayable)}</p>
                              <p className="text-gray-400">₹{emi.emiAmt}/mo</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vertical payment timeline */}
                      {emi.payments.length > 0 && (
                        <div className="mt-3 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                            <FiCalendar size={10} /> Payment History
                          </p>
                          {emi.payments.slice(0, 5).map((p) => (
                            <div key={p._id} className="flex justify-between text-[11px] pl-2">
                              <span className="text-gray-500">{fmtDate(p.date)}</span>
                              <span className="font-bold text-emerald-600">{formatINR(p.amount)}</span>
                            </div>
                          ))}
                          {emi.payments.length > 5 && (
                            <p className="text-[10px] text-gray-400 pl-2">+{emi.payments.length - 5} aur payments</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ═══ GOALS: achievement rings ═══ */}
              {goalDetails.length > 0 && (
                <Section title="Goals Achievement" hint="Target ke hisaab se kitna achieve hua" icon={FiTarget} color={CHART_COLORS.goals}>
                  <div className="space-y-3">
                    {goalDetails.map((g, i) => (
                      <motion.div
                        key={g.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex gap-3 items-center p-2 rounded-xl bg-gray-50 dark:bg-slate-800/40"
                      >
                        <MiniRing percent={g.pct} color={CHART_COLORS.goals} size={60} stroke={5} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{g.name}</p>
                          <p className="text-sm font-black text-purple-600">{formatINR(g.saved)}</p>
                          <p className="text-[10px] text-gray-400">
                            target {formatINR(g.target)} · baaki {formatINR(g.remaining)}
                          </p>
                          {g.targetMonth && (
                            <p className="text-[10px] text-gray-400">Deadline: {g.targetMonth}</p>
                          )}
                          {g.deposits.length > 0 && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">
                              Last add: {fmtDate(g.deposits[0].date)} · {formatINR(g.deposits[0].amount)}
                            </p>
                          )}
                        </div>
                        {g.isCompleted && (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full shrink-0">Done</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ═══ UDHARI: kisne kitna diya total se ═══ */}
              {udhariDetails.length > 0 && (
                <Section title="Udhari Payment" hint="Total mein se kitna pay ho chuka" icon={FiUsers} color={CHART_COLORS.udhari}>
                  <div className="space-y-3">
                    {udhariDetails.map((u, i) => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/40"
                      >
                        <div className="flex gap-3 items-center">
                          <MiniRing
                            percent={u.pct}
                            color={u.type === 'Lene Wale' ? CHART_COLORS.receive : CHART_COLORS.give}
                            size={60}
                            stroke={5}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-gray-500">{u.type}</p>
                            <div className="flex gap-2 mt-1 text-[10px]">
                              <span className="text-emerald-600 font-bold">Diya: {formatINR(u.paidAmount)}</span>
                              <span className="text-rose-500 font-bold">Baaki: {formatINR(u.remaining)}</span>
                            </div>
                            <p className="text-[10px] text-gray-400">Total tha: {formatINR(u.original)}</p>
                          </div>
                        </div>
                        {u.payments.length > 0 && (
                          <div className="mt-2 pl-2 border-l border-amber-200 dark:border-amber-800 space-y-1">
                            {u.payments.slice(0, 3).map((p) => (
                              <div key={p._id} className="flex justify-between text-[10px] pl-1">
                                <span className="text-gray-400">{fmtDate(p.date)}</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{formatINR(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsCharts;
