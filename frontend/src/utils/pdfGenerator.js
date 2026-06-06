import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../assets/image.png';

export const generateProfessionalReport = async (dashboardData, user, period, mode = 'compact') => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const isCompact = mode === 'compact';
  const margin = { top: 15, bottom: 20, left: 15, right: 15 };
  const headerHeight = 35; 
  const fontSize = isCompact ? 8 : 9;
  
  const colors = {
    primary: [37, 99, 235], secondary: [20, 184, 166], success: [34, 197, 94],
    danger: [239, 68, 68], textDark: [30, 41, 59], textMuted: [100, 116, 139],
    border: [226, 232, 240], bgLight: [248, 250, 252]
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN');
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : 'N/A';

  let currentY = margin.top;

  const safeData = dashboardData || {};
  const safeCards = safeData.cards || {};
  const safeUdhari = safeCards.udhariMetrics || {};
  const safeEmi = safeCards.emiMetrics || {};

  const totalInc = Number(safeCards.totalIncome) || 0;
  const totalExp = Number(safeCards.totalExpenses) || Number(safeCards.totalExpense) || 0;
  const netSavings = totalInc - totalExp;
  const udhariNet = (Number(safeUdhari.totalReceivable) || 0) - (Number(safeUdhari.totalPayable) || 0);

  const addHeader = () => {
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 5, 'F'); 
    try { doc.addImage(logoImage, 'PNG', margin.left, 8, 10, 10); } catch (e) {}
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...colors.primary);
    doc.text("TrackOne", margin.left + 12, 15);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...colors.textDark);
    doc.text("Money", margin.left + 38, 15);
    doc.setFontSize(8); doc.setTextColor(...colors.textMuted);
    doc.text("Confidential Financial Report", pageWidth - margin.right, 11, { align: 'right' });
    doc.setFont("helvetica", "bold"); doc.setTextColor(...colors.textDark);
    doc.text(`Period: ${period || 'N/A'}`, pageWidth - margin.right, 15, { align: 'right' });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.text(`Generated for: ${user?.name || 'User'} | Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin.right, 19, { align: 'right' });
    doc.setDrawColor(...colors.border); doc.setLineWidth(0.5);
    doc.line(margin.left, 23, pageWidth - margin.right, 23);
  };

  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - margin.bottom) {
      doc.addPage(); addHeader(); currentY = headerHeight;
    }
  };

  addHeader(); currentY = 28;

  // --- 1. EXECUTIVE SUMMARY CARDS ---
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...colors.textDark);
  doc.text("Executive Summary", margin.left, currentY); currentY += 4;

  const kpis = [
    { label: 'Total Income', value: `Rs. ${formatCurrency(totalInc)}`, color: colors.success },
    { label: 'Total Expenses', value: `Rs. ${formatCurrency(totalExp)}`, color: colors.danger },
    { label: 'Net Savings', value: `Rs. ${formatCurrency(netSavings)}`, color: colors.primary },
    { label: 'Active EMIs', value: `${Number(safeEmi.totalActive) || 0} Loans`, color: colors.textDark },
    { label: 'Pending Udhari', value: `Rs. ${formatCurrency(safeUdhari.pendingAmount)}`, color: colors.secondary },
    { label: 'Udhari (Net)', value: `Rs. ${formatCurrency(udhariNet)}`, color: colors.textDark }
  ];

  const boxWidth = (pageWidth - margin.left - margin.right - 10) / 3; 
  const boxHeight = 12; let startX = margin.left; let startY = currentY;

  kpis.forEach((kpi, index) => {
    doc.setFillColor(...colors.bgLight); doc.setDrawColor(...colors.border);
    doc.roundedRect(startX, startY, boxWidth, boxHeight, 1, 1, 'FD');
    doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.setTextColor(...colors.textMuted);
    doc.text(kpi.label.toUpperCase(), startX + 3, startY + 4.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...kpi.color);
    doc.text(kpi.value, startX + 3, startY + 9.5);
    startX += boxWidth + 5;
    if ((index + 1) % 3 === 0) { startX = margin.left; startY += boxHeight + 3; }
  });
  currentY = startY + 5;

  // --- 2. NATIVE ANALYTICS SECTION ---
  checkPageBreak(50);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...colors.textDark);
  doc.text("Financial Analytics", margin.left, currentY); currentY += 5;

  const analyticsBoxH = 45; const colW = (pageWidth - margin.left - margin.right - 5) / 2;
  doc.setFillColor(255, 255, 255); doc.setDrawColor(...colors.border);
  doc.roundedRect(margin.left, currentY, colW, analyticsBoxH, 1, 1, 'S'); 
  doc.roundedRect(margin.left + colW + 5, currentY, colW, analyticsBoxH, 1, 1, 'S'); 

  // --- 2A. NATIVE TREND BAR CHART ---
  doc.setFontSize(8); doc.text("Cash Flow Trend (6 Months)", margin.left + 3, currentY + 5);
  
  const trendData = safeData.charts?.monthlyTrend || [];
  if (trendData && trendData.length > 0) {
    let maxVal = Math.max(...trendData.map(d => Math.max(Number(d.income)||0, Number(d.expense)||0))) || 1;
    const chartX = margin.left + 5; const chartY = currentY + 10;
    const chartW = colW - 10; const chartH = 25;

    doc.setDrawColor(...colors.border);
    doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    const barAreaW = chartW / trendData.length; const barW = barAreaW * 0.35;

    trendData.forEach((d, i) => {
      const bx = chartX + (i * barAreaW);
      const incVal = Number(d.income) || 0;
      const expVal = Number(d.expense) || 0;
      
      const incH = (incVal / maxVal) * chartH;
      doc.setFillColor(...colors.success); doc.rect(bx + 2, chartY + chartH - incH, barW, incH, 'F');
      if(incVal > 0) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(...colors.success);
        doc.text(formatCurrency(incVal), bx + 2 + (barW/2), chartY + chartH - incH - 1, { align: 'center' });
      }

      const expH = (expVal / maxVal) * chartH;
      doc.setFillColor(...colors.danger); doc.rect(bx + 2 + barW + 1, chartY + chartH - expH, barW, expH, 'F');
      if(expVal > 0) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(...colors.danger);
        doc.text(formatCurrency(expVal), bx + 2 + barW + 1 + (barW/2), chartY + chartH - expH - 1, { align: 'center' });
      }

      doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(...colors.textMuted);
      const shortLabel = (d.label || d.name || d.month || 'M').split(' ')[0]; 
      doc.text(shortLabel, bx + (barAreaW/2), chartY + chartH + 3, { align: 'center' });
    });

    doc.setFillColor(...colors.success); doc.rect(chartX + 2, chartY + chartH + 6, 2, 2, 'F');
    doc.text("Income", chartX + 5, chartY + chartH + 8);
    doc.setFillColor(...colors.danger); doc.rect(chartX + 25, chartY + chartH + 6, 2, 2, 'F');
    doc.text("Expense", chartX + 28, chartY + chartH + 8);
  }

  // --- 2B. NATIVE EXPENSE BREAKDOWN ---
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...colors.textDark);
  doc.text("Top Expense Categories", margin.left + colW + 8, currentY + 5);

  const categories = safeData.charts?.expenseByCategory || [];
  const catEntries = Array.isArray(categories) ? categories.sort((a,b) => (Number(b.value)||0) - (Number(a.value)||0)).slice(0, 4) : [];
  
  if (catEntries.length > 0) {
    const totalExpPie = catEntries.reduce((sum, item) => sum + (Number(item.value)||0), 0) || 1;
    let catY = currentY + 12; const barW = colW - 16;
    
    catEntries.forEach((item) => {
      const val = Number(item.value) || 0;
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...colors.textDark);
      doc.text(item.name || 'Other', margin.left + colW + 8, catY);
      doc.setFont("helvetica", "normal");
      doc.text(`Rs. ${formatCurrency(val)}`, margin.left + colW + 5 + colW - 10, catY, { align: 'right' });

      catY += 2;
      doc.setFillColor(...colors.bgLight); doc.rect(margin.left + colW + 8, catY, barW, 2, 'F');
      const fillW = (val / totalExpPie) * barW;
      doc.setFillColor(...colors.primary); doc.rect(margin.left + colW + 8, catY, fillW, 2, 'F');
      catY += 6;
    });
  }

  currentY += analyticsBoxH + 10;

  // ==========================================
  // 3. DETAILED REPORTS (TABLES)
  // ==========================================
  const dLists = safeData.detailedLists || {};

  // --- 3A. TRANSACTION LEDGER ---
  const allTxns = [
    ...(Array.isArray(dLists.incomes) ? dLists.incomes.map(t => ({ ...t, type: 'Income' })) : []),
    ...(Array.isArray(dLists.expenses) ? dLists.expenses.map(t => ({ ...t, type: 'Expense' })) : [])
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, isCompact ? 15 : 200); // Badha diya limit

  if (allTxns.length > 0) {
    checkPageBreak(30); 
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...colors.textDark);
    doc.text(`Transaction Ledger (${period})`, margin.left, currentY);

    autoTable(doc, {
      theme: 'grid', startY: currentY + 3,
      head: [['Date', 'Type', 'Category', 'Details', 'Amount']],
      body: allTxns.map(txn => [
        formatDate(txn.date), txn.type, txn.category || txn.name || '-', (txn.source || txn.paymentMethod || txn.description || '-').substring(0, 30),
        txn.type === 'Income' ? `+ Rs.${formatCurrency(txn.amount)}` : `- Rs.${formatCurrency(txn.amount)}`
      ]),
      styles: { fontSize: fontSize, cellPadding: 2.5, lineColor: colors.border, lineWidth: 0.1 },
      headStyles: { fillColor: colors.bgLight, textColor: colors.textDark, fontStyle: 'bold' },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin.left, right: margin.right, top: headerHeight },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = data.row.raw[1] === 'Income' ? colors.success : colors.danger;
        }
      },
      didDrawPage: function () { addHeader(); }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- 3B. UDHARI MARKET LEDGER ---
  const allUdhari = Array.isArray(dLists.udhari) ? dLists.udhari : [];
  if (allUdhari.length > 0) {
    checkPageBreak(30); 
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...colors.textDark);
    doc.text("Udhari Market Ledger", margin.left, currentY);

    autoTable(doc, {
      theme: 'grid', startY: currentY + 3,
      head: [['Person Name', 'Type', 'Due Date', 'Status', 'Amount']],
      body: allUdhari.map(u => [
        u.personName || '-', u.type || '-', formatDate(u.dueDate),
        u.isSettled ? 'Settled' : 'Pending', `Rs.${formatCurrency(u.amount)}`
      ]),
      styles: { fontSize: fontSize, cellPadding: 2.5, lineColor: colors.border, lineWidth: 0.1 },
      headStyles: { fillColor: colors.bgLight, textColor: colors.textDark, fontStyle: 'bold' },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin.left, right: margin.right, top: headerHeight },
      didParseCell: function(data) {
        if (data.section === 'body') {
          if(data.column.index === 1) data.cell.styles.textColor = data.row.raw[1] === 'Lene Wale' ? colors.success : colors.danger;
          if(data.column.index === 3) data.cell.styles.textColor = data.row.raw[3] === 'Settled' ? colors.success : colors.textMuted;
        }
      },
      didDrawPage: function () { addHeader(); }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- 3C. ACTIVE EMI TRACKER (NEW ADDED) ---
  const allEmis = Array.isArray(dLists.emis) ? dLists.emis : [];
  if (allEmis.length > 0) {
    checkPageBreak(30); 
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...colors.textDark);
    doc.text("Active EMI & Loan Tracker", margin.left, currentY);

    autoTable(doc, {
      theme: 'grid', startY: currentY + 3,
      head: [['Loan Name', 'Lender', 'Next Due Date', 'Status', 'EMI Amount']],
      body: allEmis.map(e => [
        e.emiName || e.name || '-', e.lenderName || e.lender || '-', formatDate(e.nextDueDate || e.dueDate),
        e.status || 'Active', `Rs.${formatCurrency(e.emiAmount || e.amount)}`
      ]),
      styles: { fontSize: fontSize, cellPadding: 2.5, lineColor: colors.border, lineWidth: 0.1 },
      headStyles: { fillColor: colors.bgLight, textColor: colors.textDark, fontStyle: 'bold' },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin.left, right: margin.right, top: headerHeight },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = data.row.raw[3] === 'Closed' ? colors.success : colors.danger;
        }
      },
      didDrawPage: function () { addHeader(); }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- 3D. FINANCIAL GOALS ---
  const allGoals = Array.isArray(dLists.goals) ? dLists.goals : [];
  if (allGoals.length > 0) {
    checkPageBreak(30); 
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...colors.textDark);
    doc.text("Financial Goals Progress", margin.left, currentY);

    autoTable(doc, {
      theme: 'grid', startY: currentY + 3,
      head: [['Goal Name', 'Target Amount', 'Saved Amount', 'Deadline', 'Progress (%)']],
      body: allGoals.map(g => {
        const goalName = g.goalName || g.name || g.title || '-';
        const targetAmt = Number(g.targetAmount || g.target || g.goalAmount) || 1;
        const savedAmt = Number(g.savedAmount || g.saved || g.currentAmount) || 0;
        const targetDate = g.targetDate || g.deadline || g.dueDate || null;
        const progress = Math.min((savedAmt / targetAmt) * 100, 100).toFixed(1);
        return [goalName, `Rs.${formatCurrency(targetAmt)}`, `Rs.${formatCurrency(savedAmt)}`, formatDate(targetDate), `${progress}%`];
      }),
      styles: { fontSize: fontSize, cellPadding: 2.5, lineColor: colors.border, lineWidth: 0.1 },
      headStyles: { fillColor: colors.bgLight, textColor: colors.textDark, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', textColor: colors.success }, 4: { halign: 'right', fontStyle: 'bold', textColor: colors.primary } },
      margin: { left: margin.left, right: margin.right, top: headerHeight },
      didDrawPage: function () { addHeader(); }
    });
  }

  // --- ADD FOOTERS GLOBALLY ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setDrawColor(...colors.border); doc.setLineWidth(0.5);
    doc.line(margin.left, pageHeight - margin.bottom + 5, pageWidth - margin.right, pageHeight - margin.bottom + 5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...colors.textMuted);
    doc.text("TrackOne-Money | Professional Finance Intelligence", margin.left, pageHeight - 12);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin.right, pageHeight - 12, { align: 'right' });
  }

  doc.save(`TrackOne_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};