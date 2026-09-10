import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { createGatewayOrderApi, verifyGatewayPaymentApi } from '../../api/paymentGateway';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Drop-in "pay via gateway" button. Works for whatever provider the gym has
 * configured under Settings - the backend tells us if it's a 'modal' flow
 * (Razorpay, wired end-to-end below) or a 'redirect' flow (Easebuzz-style,
 * flagged as pending until the hosted-page integration is completed).
 */
export default function GatewayPayButton({
  companyName,
  memberId,
  planId,
  amount,
  invoiceAmount,
  gstRate,
  discountAmount,
  dueDate,
  description,
  onSuccess,
  disabled,
}) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const { data: order } = await createGatewayOrderApi({ memberId, amount, description });

      if (order.checkoutType === 'redirect') {
        toast.error('This gateway uses a hosted redirect page — that integration is still pending.');
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error('Could not load the payment checkout. Check your connection.');
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: companyName,
        description,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const { data: payment } = await verifyGatewayPaymentApi({
              memberId,
              planId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount,
              invoiceAmount,
              gstRate,
              discountAmount,
              dueDate,
            });
            toast.success('Payment verified and recorded');
            onSuccess?.(payment);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment succeeded but verification failed — contact support');
          }
        },
        modal: { ondismiss: () => toast('Payment cancelled') },
        theme: { color: 'var(--brand-color)' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" onClick={pay} loading={loading} disabled={disabled}>
      Pay ₹{Number(amount || 0).toLocaleString('en-IN')} via Gateway
    </Button>
  );
}