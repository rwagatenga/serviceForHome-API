const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  sex: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true
  },
  profile: {
    type: String
  },
  address: {
    type: Object,
    required: true
  },
  location: {
    type: Object,
    required: true
  },
  serviceId: [
    { 
      type: Schema.Types.ObjectId,
      ref: 'Service',
    }
  ],
  subServiceId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'SubService'
    }
  ],
  priceTag: {
    type: String,
  },
  negotiate: {
    type: String
  },
  status:{
    type: Number,
  }
}, 
{ timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
