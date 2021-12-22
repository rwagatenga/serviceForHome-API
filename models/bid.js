const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bidSchema = new Schema({
  orderId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    }
  ],
  workerId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  duration: {
    type: Date,
    default: Date.now
  },
  status:{
    type: Number,
  }
}, 
{ timestamps: true }
);

module.exports = mongoose.model('Bid', bidSchema);
