const express = require('express');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Job = require('../models/Job');
const Client = require('../models/Client');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get dashboard summary
router.get('/summary', protect, async (req, res) => {
  try {
    // Financial data
    const invoices = await Invoice.find({ status: { $in: ['issued', 'overdue', 'paid'] } });
    const expenses = await Expense.find({ status: 'approved' });
    const pendingExpenses = await Expense.find({ status: 'pending' });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Outstanding invoices
    const outstandingInvoices = invoices.filter((inv) => inv.status !== 'paid');
    const outstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.outstanding, 0);

    // Job data
    const jobs = await Job.find();
    const activeJobs = jobs.filter((j) => j.status === 'active').length;
    const completedJobs = jobs.filter((j) => j.status === 'completed').length;

    // Client data
    const clients = await Client.find({ status: 'active' });

    res.json({
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      outstanding,
      activeJobs,
      completedJobs,
      totalJobs: jobs.length,
      totalClients: clients.length,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter((i) => i.status === 'paid').length,
      pendingExpenses: pendingExpenses.length,
      approvedExpenses: expenses.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
});

// Get financial report
router.get('/financial', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query);
    const expenses = await Expense.find(query);

    const byMonth = {};

    invoices.forEach((inv) => {
      const month = inv.issueDate.toISOString().substring(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = { revenue: 0, expenses: 0 };
      }
      byMonth[month].revenue += inv.total;
    });

    expenses.forEach((exp) => {
      const month = exp.date.toISOString().substring(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = { revenue: 0, expenses: 0 };
      }
      byMonth[month].expenses += exp.amount;
    });

    res.json({
      period: {
        start: startDate || 'All time',
        end: endDate || 'All time',
      },
      data: byMonth,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching financial report', error: error.message });
  }
});

// Get job statistics
router.get('/jobs', protect, async (req, res) => {
  try {
    const jobs = await Job.find();
    const byStatus = {};
    const byCategory = {};

    jobs.forEach((job) => {
      byStatus[job.status] = (byStatus[job.status] || 0) + 1;
      byCategory[job.category] = (byCategory[job.category] || 0) + 1;
    });

    const totalCost = jobs.reduce((sum, j) => sum + (j.actualCost || 0), 0);
    const estimatedCost = jobs.reduce((sum, j) => sum + (j.estimatedCost || 0), 0);

    res.json({
      total: jobs.length,
      byStatus,
      byCategory,
      totalActualCost: totalCost,
      totalEstimatedCost: estimatedCost,
      costOverrun: totalCost - estimatedCost,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job statistics', error: error.message });
  }
});

// Get expense analysis
router.get('/expenses', protect, async (req, res) => {
  try {
    const expenses = await Expense.find();
    const byCategory = {};

    expenses.forEach((exp) => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = { count: 0, total: 0 };
      }
      byCategory[exp.category].count += 1;
      byCategory[exp.category].total += exp.amount;
    });

    const byStatus = {};
    expenses.forEach((exp) => {
      byStatus[exp.status] = (byStatus[exp.status] || 0) + 1;
    });

    res.json({
      total: expenses.length,
      byCategory,
      byStatus,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense analysis', error: error.message });
  }
});

// Get client summary
router.get('/clients', protect, async (req, res) => {
  try {
    const clients = await Client.find();

    const byStatus = {};
    clients.forEach((c) => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });

    const topClients = clients
      .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
      .slice(0, 10);

    res.json({
      total: clients.length,
      byStatus,
      totalInvoiced: clients.reduce((sum, c) => sum + c.totalInvoiced, 0),
      totalBalance: clients.reduce((sum, c) => sum + c.balance, 0),
      topClients,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client summary', error: error.message });
  }
});

module.exports = router;
