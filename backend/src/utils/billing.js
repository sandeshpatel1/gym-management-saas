/**
 * Works out the GST split + dues for any payment. `invoiceAmount` is what's
 * actually billed (taxable + tax); if not provided it defaults to `amount`
 * (fully paid, no dues, no tax). `discountAmount` reduces the billed total
 * before dues are computed. Shared by paymentController and memberController
 * so a partial payment made AT registration behaves identically to one made
 * later from the Billing page.
 */
const computeBilling = ({ amount, invoiceAmount, gstRate, discountAmount }) => {
    const rate = Number(gstRate || 0);
    const discount = Number(discountAmount || 0);
    let billed = invoiceAmount !== undefined ? Number(invoiceAmount) : Number(amount);
    billed = Math.max(0, +(billed - discount).toFixed(2));
    const taxableAmount = rate > 0 ? +(billed / (1 + rate / 100)).toFixed(2) : billed;
    const taxTotal = +(billed - taxableAmount).toFixed(2);
    const cgstAmount = +(taxTotal / 2).toFixed(2);
    const sgstAmount = +(taxTotal - cgstAmount).toFixed(2);
    const amountDue = Math.max(0, +(billed - Number(amount)).toFixed(2));
    const status = amountDue <= 0 ? 'paid' : Number(amount) > 0 ? 'partial' : 'pending';
    return {
      taxableAmount,
      gstRate: rate,
      cgstAmount,
      sgstAmount,
      invoiceAmount: billed,
      discountAmount: discount,
      amountDue,
      status,
    };
  };
  
  module.exports = { computeBilling };