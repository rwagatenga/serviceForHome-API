const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const districtSchema = new Schema({
  districtName: {
    type: String,
    required: true
  },
  provinceId: [
    { 
      type: Schema.Types.ObjectId,
      ref: 'Sector',
      required: true
    }
  ],
  sectorId: [
    { 
      type: Schema.Types.ObjectId,
      ref: 'Sector',
    }
  ]
}, 
{ timestamps: true }
);

module.exports = mongoose.model('District', districtSchema);
