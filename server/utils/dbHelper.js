import mongoose from 'mongoose';

/**
 * Checks whether the connected MongoDB deployment supports multi-document ACID transactions.
 * Standalone MongoDB (type: 'Single') does not support transactions;
 * MongoDB Atlas replica sets and Sharded clusters do.
 */
export const isTransactionSupported = () => {
  const type = mongoose.connection?.client?.topology?.description?.type;
  return Boolean(type && type !== 'Single' && type !== 'Unknown');
};
