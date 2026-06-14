const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');

// Get transactions with filtering, sorting, pagination
exports.getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMode,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create transaction (idempotent)
exports.createTransaction = async (req, res) => {
  try {
    const { orderId, items, amount, paymentMode } = req.body;

    // Idempotency check — prevent duplicate entries
    const existing = await Transaction.findOne({ orderId });
    if (existing) {
      return res.json({ message: 'Transaction already exists', transaction: existing });
    }

    const invoiceId = `INV-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const transaction = new Transaction({
      userId: req.user.id,
      orderId,
      invoiceId,
      items,
      amount,
      paymentMode,
      status: 'completed',
      auditLog: [{ event: 'created', details: `Transaction created with ${paymentMode}` }],
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single transaction
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Export CSV
exports.exportCSV = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .lean();

    // Stream CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

    // Write header
    res.write('Invoice ID,Order ID,Amount,Payment Mode,Status,Date\n');

    // Stream rows
    for (const t of transactions) {
      res.write(
        `${t.invoiceId},${t.orderId},${t.amount},${t.paymentMode},${t.status},${new Date(t.createdAt).toLocaleString()}\n`
      );
    }

    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Seed sample transactions
exports.seedTransactions = async (req, res) => {
  try {
    await Transaction.deleteMany({ userId: req.user.id });

    const paymentModes = ['UPI', 'Card', 'NetBanking', 'COD', 'Wallet'];
    const statuses = ['completed', 'completed', 'completed', 'failed', 'refunded'];
    const transactions = [];

    for (let i = 0; i < 15; i++) {
      const orderId = `ORD-${Date.now()}-${i}`;
      const invoiceId = `INV-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
      transactions.push({
        userId: req.user.id,
        orderId,
        invoiceId,
        items: [{ name: 'Sample Product', price: 999, quantity: 1 }],
        amount: Math.floor(Math.random() * 50000) + 999,
        paymentMode: paymentModes[i % paymentModes.length],
        status: statuses[i % statuses.length],
        auditLog: [{ event: 'created', details: 'Sample transaction' }],
      });
    }

    await Transaction.insertMany(transactions);
    res.json({ message: 'Transactions seeded ✅', count: transactions.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// Generate PDF Receipt
// Generate PDF Receipt
exports.generatePDF = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt-${transaction.invoiceId}.pdf`
    );

    doc.pipe(res);

    // ===== HEADER BACKGROUND =====
    doc.rect(0, 0, 612, 120).fill('#6C63FF');

    // Company Name
    doc.fontSize(32).fillColor('#FFFFFF').font('Helvetica-Bold')
      .text('MyShop', 50, 30);

    // Tagline
    doc.fontSize(11).fillColor('rgba(255,255,255,0.8)').font('Helvetica')
      .text('Your Premium Shopping Destination', 50, 70);

    // Receipt label on right
    doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold')
      .text('PAYMENT RECEIPT', 350, 40, { width: 200, align: 'right' });
    doc.fontSize(10).fillColor('rgba(255,255,255,0.8)').font('Helvetica')
      .text(`Invoice: ${transaction.invoiceId}`, 350, 65, { width: 200, align: 'right' });

    doc.moveDown(5);

    // ===== STATUS BADGE =====
    const statusColors = {
      completed: '#00C853',
      failed: '#FF4444',
      refunded: '#FF9800',
      pending: '#999999',
    };
    const statusColor = statusColors[transaction.status] || '#999999';

    doc.rect(50, 135, 120, 28).fill(statusColor);
    doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold')
      .text(transaction.status.toUpperCase(), 50, 141, { width: 120, align: 'center' });

    doc.moveDown(3);

    // ===== TWO COLUMN INFO =====
    const infoY = 185;

    // Left Column — Bill To
    doc.fontSize(10).fillColor('#999999').font('Helvetica')
      .text('BILL TO', 50, infoY);
    doc.fontSize(12).fillColor('#333333').font('Helvetica-Bold')
      .text('Customer', 50, infoY + 15);
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text(`ID: ${transaction.userId}`, 50, infoY + 30);

    // Right Column — Invoice Info
    doc.fontSize(10).fillColor('#999999').font('Helvetica')
      .text('INVOICE DETAILS', 350, infoY, { width: 200, align: 'right' });
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`, 350, infoY + 15, { width: 200, align: 'right' });
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text(`Time: ${new Date(transaction.createdAt).toLocaleTimeString()}`, 350, infoY + 30, { width: 200, align: 'right' });
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text(`Order ID: ${transaction.orderId}`, 350, infoY + 45, { width: 200, align: 'right' });

    doc.moveDown(5);

    // ===== DIVIDER =====
    doc.moveTo(50, 255).lineTo(562, 255).strokeColor('#EEEEEE').lineWidth(1).stroke();

    // ===== ITEMS TABLE HEADER =====
    doc.rect(50, 265, 512, 28).fill('#F5F5F5');
    doc.fontSize(10).fillColor('#666666').font('Helvetica-Bold')
      .text('ITEM', 60, 273)
      .text('QTY', 340, 273, { width: 60, align: 'center' })
      .text('PRICE', 420, 273, { width: 80, align: 'right' })
      .text('TOTAL', 500, 273, { width: 60, align: 'right' });

    // ===== ITEMS =====
    let itemY = 305;
    let subtotal = 0;

    if (transaction.items && transaction.items.length > 0) {
      transaction.items.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        subtotal += itemTotal;

        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, itemY - 5, 512, 25).fill('#FAFAFA');
        }

        doc.fontSize(10).fillColor('#333333').font('Helvetica')
          .text(item.name || 'Product', 60, itemY, { width: 270 })
          .text(String(item.quantity || 1), 340, itemY, { width: 60, align: 'center' })
          .text(`Rs.${(item.price || 0).toLocaleString()}`, 420, itemY, { width: 80, align: 'right' })
          .text(`Rs.${itemTotal.toLocaleString()}`, 500, itemY, { width: 60, align: 'right' });

        itemY += 30;
      });
    }

    // ===== TOTALS SECTION =====
    itemY += 10;
    doc.moveTo(50, itemY).lineTo(562, itemY).strokeColor('#EEEEEE').lineWidth(1).stroke();
    itemY += 15;

    // Subtotal
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text('Subtotal:', 400, itemY, { width: 100, align: 'right' })
      .text(`Rs.${transaction.amount.toLocaleString()}`, 500, itemY, { width: 60, align: 'right' });
    itemY += 20;

    // Payment Mode
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text('Payment Mode:', 400, itemY, { width: 100, align: 'right' })
      .text(transaction.paymentMode, 500, itemY, { width: 60, align: 'right' });
    itemY += 20;

    // Divider
    doc.moveTo(400, itemY).lineTo(562, itemY).strokeColor('#CCCCCC').lineWidth(1).stroke();
    itemY += 10;

    // Total
    doc.rect(390, itemY, 172, 32).fill('#6C63FF');
    doc.fontSize(13).fillColor('#FFFFFF').font('Helvetica-Bold')
      .text('TOTAL:', 400, itemY + 9, { width: 100, align: 'right' })
      .text(`Rs.${transaction.amount.toLocaleString()}`, 500, itemY + 9, { width: 60, align: 'right' });

    itemY += 55;

    // ===== AUDIT LOG =====
    doc.fontSize(12).fillColor('#333333').font('Helvetica-Bold')
      .text('Transaction History', 50, itemY);
    itemY += 20;

    transaction.auditLog.forEach((log) => {
      doc.circle(58, itemY + 4, 3).fill('#6C63FF');
      doc.fontSize(10).fillColor('#666666').font('Helvetica')
        .text(`${log.event.toUpperCase()} — ${log.details}`, 70, itemY)
        .text(new Date(log.timestamp).toLocaleString(), 400, itemY, { width: 160, align: 'right' });
      itemY += 20;
    });

    itemY += 20;

    // ===== FOOTER =====
    doc.moveTo(50, itemY).lineTo(562, itemY).strokeColor('#6C63FF').lineWidth(2).stroke();
    itemY += 15;

    doc.fontSize(10).fillColor('#999999').font('Helvetica')
      .text('Thank you for shopping with MyShop!', 50, itemY, { align: 'center', width: 512 });
    doc.fontSize(9).fillColor('#CCCCCC')
      .text(`Generated: ${new Date().toLocaleString()} | This is a computer generated receipt`, 50, itemY + 15, { align: 'center', width: 512 });

    doc.end();

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};