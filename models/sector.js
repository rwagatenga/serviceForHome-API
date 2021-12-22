const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sectorSchema = new Schema({
  sectorName: {
    type: String,
    required: true
  },
  districtId: [
    { 
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: true
    }
  ],
  status:{
    type: Number,
  }
}, 
{ timestamps: true }
);

module.exports = mongoose.model('Sector', sectorSchema);
