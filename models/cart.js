const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  clientId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  orders: [
    {
      type: Schema.Types.Object,
      clientId: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        }
      ],
      SubServiceId: [
        {
          type: Schema.Types.ObjectId,
          ref: 'SubService'
        }
      ],
      serviceId: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Service'
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
    }
  ],
},
{ timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
