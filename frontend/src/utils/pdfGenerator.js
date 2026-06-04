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
    primary: [37, 99, 235],
    secondary: [20, 184, 166],
    success: [34, 197, 94],
    danger: [239, 68, 68],
    textDark: [30, 41, 59],
    textMuted: [100, 116, 139],
    border: [226, 232, 240],
    bgLight: [248, 250, 252]
  };

  let currentY = margin.top;

  // --- REUSABLE HEADER ---
  const addHeader = () => {
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 5, 'F'); 

    try {
      doc.addImage(logoImage, 'PNG', margin.left, 8, 10, 10);
    } catch (e) {
      console.warn("Logo not found");
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...colors.primary);
    doc.text("TrackOne", margin.left + 12, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textDark);
    doc.text("Money", margin.left + 38, 15);

    doc.setFontSize(8);
    doc.setTextColor(...colors.textMuted);
    doc.text("Confidential Financial Report", pageWidth - margin.right, 11, { align: 'right' });
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.textDark);
    doc.text(`Period: ${period}`, pageWidth - margin.right, 15, { align: 'right' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Generated for: ${user?.name || 'User'} | Date: ${new Date().toLocaleString()}`, pageWidth - margin.right, 19, { align: 'right' });

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin.left, 23, pageWidth - margin.right, 23);
  };

  // --- PAGE BREAK CHECKER ---
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - margin.bottom) {
      doc.addPage();
      addHeader();
      currentY = headerHeight;
    }
  };

  // START REPORT
  addHeader();
  currentY = 28;

  // --- 1. EXECUTIVE SUMMARY CARDS ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.textDark);
  doc.text("Executive Summary", margin.left, currentY);
  currentY += 4;

  const kpis = [
    { label: 'Total Income', value: `Rs. ${dashboardData.cards.totalIncome.toLocaleString()}`, color: colors.success },
    { label: 'Total Expenses', value: `Rs. ${dashboardData.cards.totalExpense.toLocaleString()}`, color: colors.danger },
    { label: 'Net Savings', value: `Rs. ${dashboardData.cards.totalSavings.toLocaleString()}`, color: colors.primary },
    { label: 'Active Goals', value: `${dashboardData.cards.activeGoals}`, color: colors.textDark },
    { label: 'Goal Progress', value: `${dashboardData.cards.overallGoalCompletionPercentage}%`, color: colors.secondary },
    { label: 'Udhari (Net)', value: `Rs. ${(dashboardData.cards.totalUdhariGiven - dashboardData.cards.totalUdhariTaken).toLocaleString()}`, color: colors.textDark }
  ];

  const boxWidth = (pageWidth - margin.left - margin.right - 10) / 3; 
  const boxHeight = 12;
  let startX = margin.left;
  let startY = currentY;

  kpis.forEach((kpi, index) => {
    doc.setFillColor(...colors.bgLight);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(startX, startY, boxWidth, boxHeight, 1, 1, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...colors.textMuted);
    doc.text(kpi.label.toUpperCase(), startX + 3, startY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, startX + 3, startY + 9.5);

    startX += boxWidth + 5;
    if ((index + 1) % 3 === 0) {
      startX = margin.left;
      startY += boxHeight + 3;
    }
  });

  currentY = startY + 5;

  // --- 2. NATIVE ANALYTICS SECTION (DRAWN IN PDF, NO IMAGES) ---
  checkPageBreak(50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.textDark);
  doc.text("Financial Analytics", margin.left, currentY);
  currentY += 5;

  const analyticsBoxH = 45;
  const colW = (pageWidth - margin.left - margin.right - 5) / 2;

  // Draw Boxes
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(margin.left, currentY, colW, analyticsBoxH, 1, 1, 'S'); // Left Box (Trend)
  doc.roundedRect(margin.left + colW + 5, currentY, colW, analyticsBoxH, 1, 1, 'S'); // Right Box (Categories)

  // --- 2A. NATIVE TREND BAR CHART ---
  doc.setFontSize(8);
  doc.text("Cash Flow Trend (6 Months)", margin.left + 3, currentY + 5);
  
  const trendData = dashboardData.charts.monthlyTrend;
  if (trendData && trendData.length > 0) {
    let maxVal = Math.max(...trendData.map(d => Math.max(d.income, d.expense))) || 1;
    
    const chartX = margin.left + 5;
    const chartY = currentY + 10;
    const chartW = colW - 10;
    const chartH = 25;

    // Baseline
    doc.setDrawColor(...colors.border);
    doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    const barAreaW = chartW / trendData.length;
    const barW = barAreaW * 0.35;

    trendData.forEach((d, i) => {
      const bx = chartX + (i * barAreaW);
      
      // Income Bar
      const incH = (d.income / maxVal) * chartH;
      doc.setFillColor(...colors.success);
      doc.rect(bx + 2, chartY + chartH - incH, barW, incH, 'F');

      // Expense Bar
      const expH = (d.expense / maxVal) * chartH;
      doc.setFillColor(...colors.danger);
      doc.rect(bx + 2 + barW + 1, chartY + chartH - expH, barW, expH, 'F');

      // Month Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(...colors.textMuted);
      const shortLabel = d.label.split(' ')[0]; // e.g., "Jan"
      doc.text(shortLabel, bx + (barAreaW/2), chartY + chartH + 3, { align: 'center' });
    });

    // Legend
    doc.setFillColor(...colors.success);
    doc.rect(chartX + 2, chartY + chartH + 6, 2, 2, 'F');
    doc.text("Income", chartX + 5, chartY + chartH + 8);
    
    doc.setFillColor(...colors.danger);
    doc.rect(chartX + 25, chartY + chartH + 6, 2, 2, 'F');
    doc.text("Expense", chartX + 28, chartY + chartH + 8);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...colors.textMuted);
    doc.text("No data available", margin.left + colW/2, currentY + 25, { align: 'center' });
  }

  // --- 2B. NATIVE EXPENSE BREAKDOWN (Horizontal Progress Bars) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.textDark);
  doc.text("Top Expense Categories", margin.left + colW + 8, currentY + 5);

  const categories = dashboardData.charts.expenseByCategory;
  const catEntries = Object.entries(categories || {}).sort((a,b) => b[1] - a[1]).slice(0, 4);
  
  if (catEntries.length > 0) {
    const totalExp = catEntries.reduce((sum, [_, val]) => sum + val, 0) || 1;
    let catY = currentY + 12;
    const barW = colW - 16;
    
    catEntries.forEach(([cat, val]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...colors.textDark);
      doc.text(cat, margin.left + colW + 8, catY);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Rs. ${val.toLocaleString()}`, margin.left + colW + 5 + colW - 10, catY, { align: 'right' });

      catY += 2;
      // Background track
      doc.setFillColor(...colors.bgLight);
      doc.rect(margin.left + colW + 8, catY, barW, 2, 'F');
      
      // Fill track
      const fillW = (val / totalExp) * barW;
      doc.setFillColor(...colors.primary);
      doc.rect(margin.left + colW + 8, catY, fillW, 2, 'F');
      
      catY += 6;
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...colors.textMuted);
    doc.text("No expenses recorded", margin.left + colW + 5 + colW/2, currentY + 25, { align: 'center' });
  }

  currentY += analyticsBoxH + 8;

  // --- 3. TRANSACTION LEDGER (AutoTable) ---
  const allTxns = [
    ...(dashboardData.recentTransactions?.incomes?.map(t => ({ ...t, type: 'Income' })) || []),
    ...(dashboardData.recentTransactions?.expenses?.map(t => ({ ...t, type: 'Expense' })) || [])
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, isCompact ? 12 : 25);

  if (allTxns.length > 0) {
    checkPageBreak(20); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.textDark);
    doc.text("Transaction Ledger", margin.left, currentY);

    autoTable(doc, {
      theme: 'grid',
      startY: currentY + 3,
      head: [['Date', 'Type', 'Category', 'Details', 'Amount']],
      body: allTxns.map(txn => [
        new Date(txn.date).toLocaleDateString(),
        txn.type,
        txn.category,
        (txn.source || txn.paymentMethod || '-').substring(0, 30),
        txn.type === 'Income' ? `+ Rs.${txn.amount}` : `- Rs.${txn.amount}`
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
      didDrawPage: function () {
        addHeader(); 
      }
    });
  }

  // --- ADD FOOTERS GLOBALLY ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin.left, pageHeight - margin.bottom + 5, pageWidth - margin.right, pageHeight - margin.bottom + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...colors.textMuted);
    doc.text("TrackOne-Money | Professional Finance Intelligence", margin.left, pageHeight - 12);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin.right, pageHeight - 12, { align: 'right' });
  }

  doc.save(`TrackOne_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};