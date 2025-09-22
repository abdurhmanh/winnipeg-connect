import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Lock, Security } from '@mui/icons-material';

import { paymentsAPI } from '../../services/api';
import { addNotification } from '../../store/slices/uiSlice';
import { AppDispatch } from '../../store/store';

interface PaymentFormProps {
  quote: {
    _id: string;
    price: {
      amount: number;
      type: string;
    };
    job: {
      title: string;
      category: string;
    };
    provider: {
      firstName: string;
      lastName: string;
    };
  };
  paymentType?: 'deposit' | 'full';
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  quote,
  paymentType = 'deposit',
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch<AppDispatch>();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Calculate payment amounts
  const subtotal = paymentType === 'deposit' 
    ? Math.round(quote.price.amount * 0.5 * 100) / 100 
    : quote.price.amount;
  const platformFee = Math.round(subtotal * 0.05 * 100) / 100; // 5% platform fee
  const stripeFee = Math.round((subtotal + platformFee) * 0.029 + 0.30 * 100) / 100; // Stripe fee estimate
  const total = subtotal + platformFee + stripeFee;

  React.useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await paymentsAPI.createPaymentIntent({
        quoteId: quote._id,
        paymentType,
      });

      setClientSecret(response.clientSecret);
      setPaymentDetails({
        paymentId: response.paymentId,
        amount: response.amount,
      });
    } catch (error: any) {
      setPaymentError(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on our backend
        await paymentsAPI.confirmPayment(paymentIntent.id);
        
        dispatch(addNotification({
          type: 'success',
          title: 'Payment Successful',
          message: 'Funds have been securely held in escrow.',
        }));

        if (onSuccess && paymentDetails) {
          onSuccess(paymentDetails.paymentId);
        }
      }
    } catch (error: any) {
      setPaymentError(error.response?.data?.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Payment Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Summary
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Job: {quote.job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provider: {quote.provider.firstName} {quote.provider.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment Type: {paymentType === 'deposit' ? '50% Deposit' : 'Full Payment'}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <List dense>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary="Subtotal" 
                secondary={`$${subtotal.toFixed(2)}`}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary="Platform Fee (5%)" 
                secondary={`$${platformFee.toFixed(2)}`}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary="Processing Fee" 
                secondary={`$${stripeFee.toFixed(2)}`}
              />
            </ListItem>
            <Divider />
            <ListItem sx={{ px: 0 }}>
              <ListItemText 
                primary={
                  <Typography variant="h6" fontWeight="bold">
                    Total
                  </Typography>
                }
                secondary={
                  <Typography variant="h6" fontWeight="bold">
                    ${total.toFixed(2)} CAD
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert severity="info" icon={<Security />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Secure Escrow Payment:</strong> Your payment will be held securely until 
          the job is completed to your satisfaction. The provider will only receive payment 
          after you approve the work.
        </Typography>
      </Alert>

      {/* Payment Form */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Lock sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6">
              Secure Payment
            </Typography>
          </Box>

          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <PaymentElement 
                options={{
                  layout: 'tabs',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              )}
              
              <Button
                type="submit"
                variant="contained"
                disabled={!stripe || isProcessing}
                sx={{ minWidth: 120 }}
              >
                {isProcessing ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} color="inherit" />
                    Processing...
                  </Box>
                ) : (
                  `Pay $${total.toFixed(2)}`
                )}
              </Button>
            </Box>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Powered by Stripe. Your payment information is encrypted and secure.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentForm;
