const db = require('../config/database');
const midtransService = require('../utils/midtransService');
const { v4: uuidv4 } = require('uuid'); // Will need to install this package

const paymentController = {
  /**
   * Create a new payment for a transaction
   */
  createPayment: async (req, res) => {
    try {
      const { 
        transaksiId, 
        firstName, 
        lastName, 
        email, 
        phone, 
        paymentMethod = 'snap' 
      } = req.body;
      
      if (!transaksiId) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Transaksi ID is required' 
        });
      }
      
      // Get transaction details from database
      db.query('SELECT * FROM Transaksi WHERE ID_Transaksi = ?', [transaksiId], async (err, results) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ 
            status: 'error', 
            message: 'Database query error', 
            details: err.message 
          });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ 
            status: 'error', 
            message: 'Transaksi not found' 
          });
        }
        
        const transaksi = results[0];
        
        // Generate unique order ID
        const orderId = `ORDER-${transaksiId}-${uuidv4().substring(0, 8)}`;
        
        // Prepare payment details
        const paymentDetails = {
          orderId,
          amount: transaksi.Jumlah,
          firstName: firstName || 'Customer',
          lastName: lastName || '',
          email: email || 'customer@example.com',
          phone: phone || '08123456789',
          paymentMethod,
          description: transaksi.Keterangan || `Payment for transaction ${transaksiId}`
        };
        
        // Create payment in Midtrans
        const paymentResult = await midtransService.createTransaction(paymentDetails);
        
        if (!paymentResult.success) {
          return res.status(500).json({ 
            status: 'error', 
            message: 'Failed to create payment', 
            details: paymentResult.error 
          });
        }
        
        // Store payment info in database
        const paymentData = {
          ID_Transaksi: transaksiId,
          Order_ID: orderId,
          Payment_Method: paymentMethod,
          Amount: transaksi.Jumlah,
          Status: 'pending',
          Created_At: new Date(),
          Updated_At: new Date()
        };
        
        // This assumes you have a Payments table
        // If not, you might need to create one
        db.query('INSERT INTO Payments SET ?', paymentData, (err, result) => {
          if (err) {
            console.error('Failed to save payment data:', err);
            // Still return the payment URL even if saving to DB fails
          }
          
          // Return the payment information
          res.json({
            status: 'success',
            message: 'Payment initiated',
            data: {
              orderId: paymentResult.data.orderId,
              token: paymentResult.data.token,
              redirectUrl: paymentResult.data.redirect_url,
              amount: transaksi.Jumlah,
              status: 'pending'
            }
          });
        });
      });
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error creating payment', 
        details: error.message 
      });
    }
  },

  /**
   * Check payment status
   */
  checkStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Order ID is required' 
        });
      }
      
      // Get status from Midtrans
      const statusResult = await midtransService.getStatus(orderId);
      
      if (!statusResult.success) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to check payment status', 
          details: statusResult.error 
        });
      }
      
      // Update payment status in database if needed
      if (statusResult.data.transaction_status !== 'pending') {
        // This assumes you have a Payments table
        db.query(
          'UPDATE Payments SET Status = ?, Updated_At = ? WHERE Order_ID = ?',
          [statusResult.data.transaction_status, new Date(), orderId],
          (err) => {
            if (err) {
              console.error('Failed to update payment status:', err);
            }
          }
        );
      }
      
      // Return the status
      res.json({
        status: 'success',
        data: {
          orderId: statusResult.data.order_id,
          transactionStatus: statusResult.data.transaction_status,
          paymentType: statusResult.data.payment_type,
          amount: statusResult.data.gross_amount,
          time: statusResult.data.transaction_time
        }
      });
    } catch (error) {
      console.error('Check payment status error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error checking payment status', 
        details: error.message 
      });
    }
  },

  /**
   * Handle notification from Midtrans
   */
  handleNotification: async (req, res) => {
    try {
      const notification = req.body;
      
      // Process notification
      const result = await midtransService.handleNotification(notification);
      
      if (!result.success) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to process notification', 
          details: result.error 
        });
      }
      
      // Update payment status in database
      db.query(
        'UPDATE Payments SET Status = ?, Updated_At = ? WHERE Order_ID = ?',
        [result.data.status, new Date(), result.data.orderId],
        (err) => {
          if (err) {
            console.error('Failed to update payment status:', err);
            return res.status(500).json({ 
              status: 'error', 
              message: 'Failed to update payment status', 
              details: err.message 
            });
          }
          
          // Return success
          res.json({
            status: 'success',
            message: 'Notification processed successfully'
          });
        }
      );
    } catch (error) {
      console.error('Notification handling error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error processing notification', 
        details: error.message 
      });
    }
  }
};

module.exports = paymentController; 