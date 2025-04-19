const midtransConfig = require('../config/midtrans.js');

/**
 * This file contains the actual Midtrans client implementation
 * To be used once the midtrans-client package is installed
 */

// Uncomment once midtrans-client is installed
// const midtransClient = require('midtrans-client');

const createMidtransClient = () => {
  // Mock implementation for now
  // Once midtrans-client is installed, replace with:
  /*
  return new midtransClient.Snap({
    isProduction: midtransConfig.isProduction,
    serverKey: midtransConfig.serverKey,
    clientKey: midtransConfig.clientKey
  });
  */
  
  // Returning mock client for now
  return {
    createTransaction: async (parameter) => {
      console.log('Creating transaction with parameters:', parameter);
      return {
        token: 'mock-token-' + Math.random().toString(36).substring(2, 15),
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${Math.random().toString(36).substring(2, 15)}`
      };
    }
  };
};

const createCoreApiClient = () => {
  // Mock implementation for now
  // Once midtrans-client is installed, replace with:
  /*
  return new midtransClient.CoreApi({
    isProduction: midtransConfig.isProduction,
    serverKey: midtransConfig.serverKey,
    clientKey: midtransConfig.clientKey
  });
  */
  
  // Returning mock client for now
  return {
    charge: async (parameter) => {
      console.log('Charging with parameters:', parameter);
      return {
        transaction_id: 'mock-transaction-' + Math.random().toString(36).substring(2, 15),
        order_id: parameter.order_id,
        gross_amount: parameter.transaction_details.gross_amount,
        payment_type: parameter.payment_type,
        transaction_time: new Date().toISOString(),
        transaction_status: 'pending'
      };
    },
    
    cardToken: async (parameter) => {
      console.log('Creating card token with parameters:', parameter);
      return {
        token_id: 'mock-token-' + Math.random().toString(36).substring(2, 15),
        masked_card: '48111111-1114'
      };
    },
    
    status: async (orderId) => {
      console.log('Checking status for order:', orderId);
      return {
        transaction_id: 'mock-transaction-' + Math.random().toString(36).substring(2, 15),
        order_id: orderId,
        gross_amount: '10000.00',
        payment_type: 'credit_card',
        transaction_time: new Date().toISOString(),
        transaction_status: 'settlement'
      };
    }
  };
};

module.exports = {
  createMidtransClient,
  createCoreApiClient
}; 