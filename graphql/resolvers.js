//
const validator = require("validator");
// const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Province = require("../models/province");
const District = require("../models/district");
const Sector = require("../models/sector");

const Service = require("../models/service");
const SubService = require("../models/subservice");

const User = require("../models/user");
const Order = require("../models/order");
const Bid = require("../models/bid");
const Cart = require("../models/cart");

//Resolvers - This are the set of the function defined to get the desired output for the given API
const resolvers = {
	Query:{
		//This is Viewing all Services Function
		viewServices: async function (args, req) {
			const services = await Service.find()
				.sort({ createdAt: -1 })
				.populate("subServiceId");
			return {
				services: services.map((service) => {
					return {
						...service._doc,
						_id: service._id.toString(),
						createdAt: service.createdAt.toISOString(),
						updatedAt: service.updatedAt.toISOString(),
					};
				}),
			};
		},
	},
	
	Mutation: {
		//This Create Service Function
		createService: async function (parent, { serviceData }, { pubsub }) {
			console.log("SERVICE", serviceData.serviceName);
			const errors = [];

			if (serviceData.serviceName == null || serviceData.serviceName == "") {
				errors.push({ message: "Please Insert Service Name" });
			}
			if (!validator.isLength(serviceData.serviceName, { min: 3 })) {
				errors.push({ message: "Service Name is too Short" });
			}
			if (errors.length > 0) {
				const error = new Error("Invalid input.");
				error.data = errors;
				error.code = 422;
				throw error;
			}
			const existingService = await Service.findOne({
				serviceName: serviceData.serviceName,
			});
			if (existingService) {
				const error = new Error("Service already exists!");
				throw error;
			}
			const service = new Service({
				serviceName: serviceData.serviceName,
				status: 0,
			});
			const services = await service.save(); //It needs some Socket.IO
			console.log("INPUT", serviceData)
			
			const service_push = {
				...services._doc,
				_id: services._id.toString(),
				createdAt: services.createdAt.toISOString(),
				updatedAt: service.updatedAt.toISOString(),
			}
			console.log("OUTPUT", service_push)
			pubsub.publish('service', {
				service: {
					mutation: 'SERVICE_CREATED',
					data: { ...service_push }
				}
			});
			return {
				...services._doc,
				_id: services._id.toString(),
				createdAt: services.createdAt.toISOString(),
				updatedAt: service.updatedAt.toISOString(),
			};
		},
	},
	Subscription: {
		service: {
			subscribe(parent, args, { pubsub }) {
				return pubsub.asyncIterator('service');
			}
		}
	},
}

module.exports = resolvers;