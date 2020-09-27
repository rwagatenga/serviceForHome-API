const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const provinceSchema = new Schema({
  provinceName: {
    type: String,
    required: true
  },
}, 
{ timestamps: true }
);

module.exports = mongoose.model('Province', provinceSchema);
