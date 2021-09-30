const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  serviceName: {
    type: String,
    required: true
  }, 
  subServiceId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'SubService'
    }
  ]
},
{ timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
