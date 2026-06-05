const Emi = require('../models/Emi');
const EmiPayment = require('../models/EmiPayment');

const createEmi = async (req, res, next) => {
  try {
    const emi = await Emi.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: emi });
  } catch (error) { next(error); }
};

const getEmis = async (req, res, next) => {
  try {
    const emis = await Emi.find({ user: req.user._id }).sort({ nextDueDate: 1 });
    
    // Calculate Dashboard Metrics
    let totalActive = 0, monthlyBurden = 0, totalOutstanding = 0, totalPaid = 0, overdueCount = 0;
    
    const today = new Date();
    emis.forEach(emi => {
      if (emi.status !== 'Closed') {
        totalActive++;
        monthlyBurden += emi.emiAmount;
        totalOutstanding += (emi.principalAmount - emi.totalPaidAmount); // Simplified outstanding
        if (new Date(emi.nextDueDate) < today) overdueCount++;
      }
      totalPaid += emi.totalPaidAmount;
    });

    res.status(200).json({ 
      success: true, 
      metrics: { totalActive, monthlyBurden, totalOutstanding, totalPaid, overdueCount },
      data: emis 
    });
  } catch (error) { next(error); }
};

const recordPayment = async (req, res, next) => {
  try {
    const { amountPaid, paymentDate, notes } = req.body;
    const emi = await Emi.findOne({ _id: req.params.id, user: req.user._id });
    if (!emi) return res.status(404).json({ success: false, message: 'EMI not found' });

    // Record Payment
    await EmiPayment.create({ emiId: emi._id, user: req.user._id, amountPaid, paymentDate, notes });

    // Update EMI Status
    emi.totalPaidAmount += amountPaid;
    emi.paidInstallments += 1;
    
    // Shift next due date by 1 month
    const nextDue = new Date(emi.nextDueDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
    emi.nextDueDate = nextDue;

    if (emi.paidInstallments >= emi.tenureMonths || emi.totalPaidAmount >= emi.principalAmount) {
      emi.status = 'Closed';
    } else if (emi.nextDueDate < new Date()) {
      emi.status = 'Overdue';
    } else {
      emi.status = 'Active';
    }

    await emi.save();
    res.status(200).json({ success: true, data: emi });
  } catch (error) { next(error); }
};

const deleteEmi = async (req, res, next) => {
  try {
    const emi = await Emi.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!emi) return res.status(404).json({ success: false, message: 'EMI not found' });
    await EmiPayment.deleteMany({ emiId: req.params.id });
    res.status(200).json({ success: true, message: 'EMI Record deleted' });
  } catch (error) { next(error); }
};

module.exports = { createEmi, getEmis, recordPayment, deleteEmi };