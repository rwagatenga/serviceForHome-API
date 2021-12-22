const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subServiceSchema = new Schema({
  subServiceName: {
    type: String,
    required: true
  }, 
  price: {
    type: String
  },
  photo: {
    type: String,
  },
  serviceId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    }
  ]
},
{ timestamps: true }
);

module.exports = mongoose.model('SubService', subServiceSchema);
