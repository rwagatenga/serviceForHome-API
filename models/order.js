const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  clientId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  serviceId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    }
  ],
  subServiceId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'SubService',
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
  },
  bids: [
    {
      workerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      price: {
        type: String,
      },
      description: {
        type: String
      },
      bidTime: {
        type: String,
      },
      status: {
        type: Number
      }
    }
  ]
},
{ timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
