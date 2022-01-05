const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
	type: {
		type: String,
		enum: ["Point"],
		required: true,
	},
	coordinates: {
		type: [Number],
		required: true,
	},
});

const userSchema = new Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		sex: {
			type: String,
			required: true,
		},
		telephone: {
			type: String,
			required: true,
			index: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		userType: {
			type: String,
			required: true,
		},
		profile: {
			type: String,
		},
		address: {
			type: Object,
			required: true,
		},
		location: {
			type: Object,
			required: true,
		},
    loc: LocationSchema,
		serviceId: [
			{
				type: Schema.Types.ObjectId,
				ref: "Service",
			},
		],
		subServiceId: [
			{
				type: Schema.Types.ObjectId,
				ref: "SubService",
			},
		],
		priceTag: {
			type: String,
		},
		negotiate: {
			type: String,
		},
		status: {
			type: Number,
    },
    connections: [
      {
        type: Object
      }
    ]
	},
	{ timestamps: true }
);
userSchema.index({ loc: "2dsphere" });
module.exports = mongoose.model("User", userSchema);
