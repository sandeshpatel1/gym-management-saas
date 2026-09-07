const https = require('https');
const http = require('http');

const fetchImageBuffer = (url) =>
  new Promise((resolve) => {
    if (!url || !/^https?:\/\//i.test(url)) return resolve(null);
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });

const money = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

/**
 * Draws a full, professional GST-ready invoice into an already-piped PDFKit
 * doc. Used by the payment invoice export (and reusable anywhere else you
 * want a matching invoice look).
 */
const drawInvoice = async (doc, { company, member, payment }) => {
  const primary = company?.branding?.primaryColor || '#0A84FF';
  const logoBuffer = await fetchImageBuffer(company?.branding?.logoUrl);

  // --- Watermark (diagonal, behind everything) ---
  doc.save();
  doc.rotate(-38, { origin: [300, 400] });
  doc.fontSize(64).fillColor('#000000').opacity(0.05);
  doc.text((company?.name || 'GYM').toUpperCase(), 40, 380, { width: 700, align: 'center' });
  doc.opacity(1);
  doc.restore();

  // --- Header: logo + gym identity ---
  const headerY = 40;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 40, headerY, { fit: [64, 64] });
    } catch {
      /* corrupt/unsupported image - invoice still generates without it */
    }
  }
  const textX = logoBuffer ? 116 : 40;
  doc.fillColor('#111').fontSize(18).text(company?.name || 'Gym', textX, headerY, { width: 320 });
  doc.fontSize(9).fillColor('#555');
  const addr = company?.contact || {};
  const addrLine = [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
  if (addrLine) doc.text(addrLine, textX, doc.y + 2, { width: 320 });
  if (addr.phone) doc.text(`Phone: ${addr.phone}`, textX, doc.y + 2, { width: 320 });
  if (addr.email) doc.text(`Email: ${addr.email}`, textX, doc.y + 2, { width: 320 });
  if (company?.invoiceSettings?.gstin) {
    doc.text(`GSTIN: ${company.invoiceSettings.gstin}`, textX, doc.y + 2, { width: 320 });
  }

  // --- Invoice meta box (top right) ---
  doc.fontSize(20).fillColor(primary).text('INVOICE', 380, headerY, { width: 175, align: 'right' });
  doc.fontSize(9).fillColor('#333');
  doc.text(`Invoice #: ${payment.invoiceNumber}`, 380, doc.y + 6, { width: 175, align: 'right' });
  doc.text(`Date: ${new Date(payment.paidAt).toLocaleDateString()}`, 380, doc.y + 2, { width: 175, align: 'right' });
  if (payment.dueDate) {
    doc.text(`Due: ${new Date(payment.dueDate).toLocaleDateString()}`, 380, doc.y + 2, { width: 175, align: 'right' });
  }
  const statusColor =
    payment.status === 'paid' ? '#16a34a' : payment.status === 'partial' ? '#d97706' : '#dc2626';
  doc.fontSize(11).fillColor(statusColor).text((payment.status || 'paid').toUpperCase(), 380, doc.y + 6, {
    width: 175,
    align: 'right',
  });

  doc.moveDown(2);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(1);

  // --- Bill to ---
  doc.fillColor('#888').fontSize(9).text('BILL TO', 40, doc.y);
  doc.fillColor('#111').fontSize(12).text(member?.fullName || '—', 40, doc.y + 2);
  doc.fontSize(9).fillColor('#555');
  if (member?.memberCode) doc.text(`Member Code: ${member.memberCode}`, 40, doc.y + 2);
  if (member?.phone) doc.text(`Phone: ${member.phone}`, 40, doc.y + 2);
  if (member?.email) doc.text(`Email: ${member.email}`, 40, doc.y + 2);

  doc.moveDown(1.5);

  // --- Line items table ---
  const tableTop = doc.y;
  const col = { desc: 40, qty: 300, rate: 360, amount: 460 };
  doc.rect(40, tableTop, 515, 20).fill(primary);
  doc.fillColor('#fff').fontSize(9);
  doc.text('Description', col.desc + 6, tableTop + 5, { width: 250 });
  doc.text('Qty', col.qty, tableTop + 5, { width: 50, align: 'right' });
  doc.text('Rate', col.rate, tableTop + 5, { width: 90, align: 'right' });
  doc.text('Amount', col.amount, tableTop + 5, { width: 90, align: 'right' });

  let y = tableTop + 26;
  doc.fillColor('#111').fontSize(10);
  const desc = payment.plan?.name ? `Membership: ${payment.plan.name}` : payment.note || 'Payment received';
  const taxable = payment.taxableAmount ?? payment.invoiceAmount ?? payment.amount;
  doc.text(desc, col.desc + 6, y, { width: 250 });
  doc.text('1', col.qty, y, { width: 50, align: 'right' });
  doc.text(money(taxable), col.rate, y, { width: 90, align: 'right' });
  doc.text(money(taxable), col.amount, y, { width: 90, align: 'right' });
  y += 22;

  doc.moveTo(40, y).lineTo(555, y).strokeColor('#eee').stroke();
  y += 10;

  // --- Totals ---
  const totalsX = 360;
  doc.fontSize(9).fillColor('#555');
  doc.text('Subtotal', totalsX, y, { width: 100 });
  doc.text(money(taxable), totalsX + 100, y, { width: 95, align: 'right' });
  y += 16;

  if (payment.gstRate) {
    doc.text(`CGST (${(payment.gstRate / 2).toFixed(1)}%)`, totalsX, y, { width: 100 });
    doc.text(money(payment.cgstAmount), totalsX + 100, y, { width: 95, align: 'right' });
    y += 16;
    doc.text(`SGST (${(payment.gstRate / 2).toFixed(1)}%)`, totalsX, y, { width: 100 });
    doc.text(money(payment.sgstAmount), totalsX + 100, y, { width: 95, align: 'right' });
    y += 16;
  }

  doc.moveTo(totalsX, y).lineTo(555, y).strokeColor('#ccc').stroke();
  y += 8;
  doc.fontSize(12).fillColor('#111');
  doc.text('Total', totalsX, y, { width: 100 });
  doc.text(money(payment.invoiceAmount ?? payment.amount), totalsX + 100, y, { width: 95, align: 'right' });
  y += 20;

  doc.fontSize(9);
  doc.fillColor('#16a34a').text('Amount Paid', totalsX, y, { width: 100 });
  doc.fillColor('#16a34a').text(money(payment.amount), totalsX + 100, y, { width: 95, align: 'right' });
  y += 16;

  if (payment.amountDue > 0) {
    doc.fillColor('#dc2626').text('Amount Due', totalsX, y, { width: 100 });
    doc.fillColor('#dc2626').text(money(payment.amountDue), totalsX + 100, y, { width: 95, align: 'right' });
    y += 16;
  }

  doc.fillColor('#111');
  doc.moveDown(3);

  // --- Terms & instructions (must-have gym policies) ---
  const terms =
    company?.invoiceSettings?.termsAndConditions?.length > 0
      ? company.invoiceSettings.termsAndConditions
      : [
          'Membership fees, once paid, are non-refundable and non-transferable.',
          'Please carry this invoice / a valid ID for verification at the front desk.',
          'Membership validity begins from the start date shown on your plan, regardless of usage.',
          'Renew before the expiry date to avoid a break in your training schedule.',
          'For billing queries, contact the gym front desk within 7 days of this invoice.',
        ];
  doc.fontSize(10).fillColor('#111').text('Terms & Instructions', 40, doc.y);
  doc.moveDown(0.3);
  doc.fontSize(8.5).fillColor('#555');
  terms.forEach((t, i) => doc.text(`${i + 1}. ${t}`, 40, doc.y + 2, { width: 515 }));

  if (company?.invoiceSettings?.footerNote) {
    doc.moveDown(1);
    doc.fontSize(9).fillColor('#888').text(company.invoiceSettings.footerNote, 40, doc.y, { width: 515 });
  }

  doc.moveDown(1.5);
  doc
    .fontSize(8)
    .fillColor('#aaa')
    .text('This is a system-generated invoice.', 40, doc.y, { align: 'center', width: 515 });
};

module.exports = { drawInvoice, fetchImageBuffer };