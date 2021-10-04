const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { PubSub } = require("graphql-subscriptions");

const Province = require("../models/province");
const District = require("../models/district");
const Sector = require("../models/sector");

const Service = require("../models/service");
const SubService = require("../models/subservice");

const User = require("../models/user");
const Order = require("../models/order");
const Bid = require("../models/bid");
const Cart = require("../models/cart");

const pubsub = new PubSub(); //create a PubSub instance

const SOMETHING_CHANGED_SERVICE = "something_changed";
module.exports = {
	//This Create Service Function
	createService: async function ({ serviceData }, req) {
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
		pubsub.publish('services', {
			service:{
				mutation: 'SERVICE_CREATED',
				serviceData: {...services}
			}
		}); 
		return {
			...services._doc,
			_id: services._id.toString(),
			createdAt: services.createdAt.toISOString(),
			updatedAt: service.updatedAt.toISOString(),
		};
	},

	// This is Subscription
	Subscription: {
		serviceAdded: {  // create a channelAdded subscription resolver function.
		subscribe: () => pubsub.asyncIterator(SOMETHING_CHANGED_SERVICE)  // subscribe to changes in a topic
		}
	},

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

	//This Updating Service Function
	updateService: async function ({ id, serviceInput }, req) {
		const service = await Service.findById(id); //.populate("creator");
		if (!service) {
			const error = new Error("No Service found!");
			error.code = 404;
			throw error;
		}
		const errors = [];
		if (
			validator.isEmpty(serviceInput.serviceName) ||
			!validator.isLength(serviceInput.serviceName, { min: 3 })
		) {
			errors.push({ message: "Service Name is invalid." });
		}
		if (errors.length > 0) {
			const error = new Error("Invalid input.");
			error.data = errors;
			error.code = 422;
			throw error;
		}
		service.serviceName = serviceInput.serviceName;
		const updatedService = await service.save(); //It needs some Socket.IO

		return {
			...updatedService._doc,
			_id: updatedService._id.toString(),
			createdAt: updatedService.createdAt.toISOString(),
			updatedAt: updatedService.updatedAt.toISOString(),
		};
	},

	//This Deleting Service Function
	deleteService: async function ({ id }, req) {
		const service = await Service.findById(id);
		if (!service) {
			const error = new Error("That Service not Found!");
			error.code = 404;
			throw error;
		}
		await SubService.deleteMany({ service: service._id });
		await Service.findByIdAndRemove(id); //It needs some Socket.IO
		// const user = await User.findById(req.userId);
		// user.posts.pull(id);
		// await user.save();
		return true;
	},

	//This is Creating SubService Function
	createSubService: async function ({ id, subServiceData }, req) {
		const service = await Service.findById(id);
		const errors = [];

		if (
			subServiceData.subServiceName == null ||
			subServiceData.subServiceName == ""
		) {
			errors.push({ message: "Please Insert SubService Name" });
		}
		if (!validator.isLength(subServiceData.subServiceName, { min: 3 })) {
			errors.push({ message: "SubService Name is too Short" });
		}
		if (
			subServiceData.price == null ||
			subServiceData.subServiceName == ""
		) {
			errors.push({ message: "Please Insert SubService Price" });
		}
		if (!id || id.toString == "" || !service) {
			errors.push({
				message: "Can't Insert SubService without its Service Category",
			});
		}
		if (errors.length > 0) {
			const error = new Error("Invalid input.");
			error.data = errors;
			error.code = 422;
			throw error;
		}

		const subService = new SubService({
			subServiceName: subServiceData.subServiceName,
			price: subServiceData.price,
			serviceId: service,
		});
		const datas = await subService.save(); //It needs some Socket.IO
		service.subServiceId.push(datas);
		await service.save();

		const data = await SubService.findOne({ _id: datas._id }).populate(
			"serviceId"
		);
		return {
			...data._doc,
			_id: data._id.toString(),
			createdAt: data.createdAt.toISOString(),
			updatedAt: data.updatedAt.toISOString(),
		};
	},

	// This is Updating SubService Function
	updateSubService: async function ({ id, subServiceInput }, req) {
		const subService = await SubService.findById(id).populate("serviceId");
		if (!subService) {
			const error = new Error("No SubService found!");
			error.code = 404;
			throw error;
		}
		const errors = [];
		if (
			validator.isEmpty(subServiceInput.subServiceName) ||
			!validator.isLength(subServiceInput.subServiceName, { min: 3 })
		) {
			errors.push({ message: "SubService Name is invalid." });
		}
		if (errors.length > 0) {
			const error = new Error("Invalid input.");
			error.data = errors;
			error.code = 422;
			throw error;
		}
		subService.subServiceName = subServiceInput.subServiceName;
		subService.price = subServiceInput.price;
		const updatedSubService = await subService.save(); //It needs some Socket.IO
		const data = await SubService.findById(updatedSubService._id).populate(
			"serviceId"
		);
		return {
			...data._doc,
			_id: data._id.toString(),
			createdAt: data.createdAt.toISOString(),
			updatedAt: data.updatedAt.toISOString(),
		};
	},

	// This is Delete SubService Function
	deleteSubService: async function ({ id }, req) {
		const subService = await SubService.findById(id);
		if (!subService) {
			const error = new Error("That SubService found!");
			error.code = 404;
			throw error;
		}
		const service = await Service.findById(subService.serviceId); //It needs some Socket.IO
		service.subServiceId.pull(id);
		await service.save();
		await SubService.findByIdAndRemove(id);
		return true;
	},

	// This is Function of View all SubServices
	viewSubServices: async function () {
		const subServices = await SubService.find()
			.sort({ createdAt: -1 })
			.populate("serviceId");
		return {
			subServices: subServices.map((subService) => {
				return {
					...subService._doc,
					_id: subService._id.toString(),
					createdAt: subService.createdAt.toISOString(),
					updatedAt: subService.updatedAt.toISOString(),
				};
			}),
		};
	},

	// This is the Login Function
	login: async function ({ email, password }) {
		const user = await User.findOne({ email: email });
		if (!user) {
			const error = new Error("User not found.");
			error.code = 401;
			throw error;
		}
		const isEqual = await bcrypt.compare(password, user.password);
		if (!isEqual) {
			const error = new Error("Password is incorrect.");
			error.code = 401;
			throw error;
		}
		const token = jwt.sign(
			{
				userId: user._id.toString(),
				email: user.email,
			},
			"somesupersecretsecrets",
			{ expiresIn: "1h" }
		);
		const users = await User.find({ email: email })
			.populate({
				path: "serviceId",
				model: "Service",
			})
			.populate({
				path: "subServiceId",
				model: "SubService",
			});
		return {
			token: token,
			userId: user._id.toString(),
			userType: user.userType,
			expiresIn: 3600,
			// user: user,
			users: users.map((item) => {
				return {
					...item._doc,
					_id: item._id.toString(),
					createdAt: item.createdAt.toISOString(),
					updatedAt: item.updatedAt.toISOString(),
				};
			}),
		};
	},
	// This is the creation of User Function
	createUser: async function (
		{ token, expiresIn, serviceId, subServiceId, userInput },
		req
	) {
		const errors = [];
		if (!validator.isEmail(userInput.email)) {
			errors.push({ message: "E-Mail is invalid." });
		}
		if (
			validator.isEmpty(userInput.password) ||
			!validator.isLength(userInput.password, { min: 5 })
		) {
			errors.push({ message: "Password too short!" });
		}
		if (errors.length > 0) {
			const error = new Error("Invalid input.");
			error.data = errors;
			error.code = 422;
			throw error;
		}
		const existingUser = await User.findOne({
			$or: [
				{ email: userInput.email },
				{ telephone: userInput.telephone },
			],
		});
		if (existingUser) {
			const error = new Error("User exists already!");
			throw error;
		}
		const hashedPw = await bcrypt.hash(userInput.password, 12);

		if (userInput.userType === "Client") {
			const user = new User({
				firstName: userInput.firstName,
				lastName: userInput.lastName,
				sex: userInput.sex,
				telephone: userInput.telephone,
				email: userInput.email,
				password: hashedPw,
				userType: userInput.userType,
				address: {
					province: userInput.address.province,
					district: userInput.address.district,
					sector: userInput.address.sector,
				},
			});
			const createdUser = await user.save();
			token = jwt.sign(
				{
					userId: createdUser._id.toString(),
					email: createdUser.email,
				},
				"somesupersecretsecrets",
				{ expiresIn: "1h" }
			);
			expiresIn = 3600;
			return {
				...createdUser._doc,
				_id: createdUser._id.toString(),
				createdAt: createdUser.createdAt.toISOString(),
				updatedAt: createdUser.updatedAt.toISOString(),
				token: token,
				expiresIn: expiresIn,
			};
		}
		if (userInput.userType === "Worker") {
			const service = await Service.findById(serviceId);
			const subService = await SubService.find({
				_id: { $in: subServiceId },
			});
			if (validator.isEmpty(serviceId)) {
				errors.push({ message: "Please Select any Service" });
			}
			if (subServiceId.length <= 0) {
				errors.push({
					message: "Please Select any SubService in that Service",
				});
			}
			if (!service) {
				const error = new Error("That Service no longer available!");
				throw error;
			}
			if (!subService) {
				const error = new Error(
					"That SubService no longer available in That Service!"
				);
				throw error;
			}
			if (
				validator.isEmpty(userInput.address.province) ||
				validator.isEmpty(userInput.address.district) ||
				validator.isEmpty(userInput.address.sector)
			) {
				const error = new Error("Empty Address");
				error.code = 404;
				throw error;
			}
			const user = new User({
				firstName: userInput.firstName,
				lastName: userInput.lastName,
				sex: userInput.sex,
				telephone: userInput.telephone,
				email: userInput.email,
				password: hashedPw,
				userType: userInput.userType,
				address: {
					province: userInput.address.province,
					district: userInput.address.district,
					sector: userInput.address.sector,
				},
				serviceId: service,
				subServiceId: subService,
				priceTag: userInput.priceTag,
				negotiate: userInput.negotiate,
				status: 1,
			});
			const createdUsers = await user.save();
			const createdUser = await User.findOne({ _id: createdUsers._id })
				.populate("serviceId")
				.populate("subServiceId");
			token = jwt.sign(
				{
					userId: createdUser._id.toString(),
					email: createdUser.email,
				},
				"somesupersecretsecrets",
				{ expiresIn: "1h" }
			);
			expiresIn = 3600;
			return {
				...createdUser._doc,
				_id: createdUser._id.toString(),
				createdAt: createdUser.createdAt.toISOString(),
				updatedAt: createdUser.updatedAt.toISOString(),
				token: token,
				expiresIn: expiresIn,
			};
		}
	},

	// This is Updating User Information Function
	updateUser: async function (
		{ userId, serviceId, subServiceId, userInput },
		req
	) {
		const user = await User.findOne({ _id: userId });
		if (!user) {
			const error = new Error("User not found.");
			error.code = 401;
			throw error;
		}

		const isEqual = await bcrypt.compare(
			userInput.currentPassword,
			user.password
		);
		if (!isEqual) {
			const error = new Error("Your Current Password is incorrect.");
			error.code = 401;
			throw error;
		}
		const newPassword = await bcrypt.hash(userInput.password, 12);
		if (user.userType === "Client") {
			user.firstName = userInput.firstName;
			user.lastName = userInput.lastName;
			user.telephone = userInput.telephone;
			user.email = userInput.email;
			user.userType = userInput.userType;
			user.password = newPassword;
			user.address = {
				province: userInput.address.province,
				district: userInput.address.district,
				sector: userInput.address.sector,
			};

			const updatedUser = await user.save(); //It needs some Socket.IO
			return {
				...updatedUser._doc,
				_id: updatedUser._id.toString(),
				createdAt: updatedUser.createdAt.toISOString(),
				updatedAt: updatedUser.updatedAt.toISOString(),
			};
		}
		if (user.userType === "Worker") {
			const service = await Service.findById(serviceId);
			const subService = await SubService.find({
				_id: { $in: subServiceId },
			});

			user.firstName = userInput.firstName;
			user.lastName = userInput.lastName;
			user.telephone = userInput.telephone;
			user.email = userInput.email;
			user.userType = userInput.userType;
			user.address = {
				province: userInput.province,
				district: userInput.district,
				sector: userInput.sector,
			};
			user.serviceId = service;
			user.subServiceId = subService;
			user.priceTag = userInput.priceTag;
			user.negotiate = userInput.negotiate;

			const updatedUser = await user.save();
			return {
				...updatedUser._doc,
				_id: updatedUser._id.toString(),
				createdAt: updatedUser.createdAt.toISOString(),
				updatedAt: updatedUser.updatedAt.toISOString(),
			};
		}
	},

	// This is Creating Orders Function
	createOrders: async function ({ clientId, orderInput }, req) {
		const user = await User.findById(clientId);
		if (new Date(orderInput.duration) < new Date()) {
			const error = new Error(
				"Your Order's Duration is Less Than ToDay!"
			);
			throw error;
		}
		if (!user) {
			const error = new Error("User does not exist already!");
			throw error;
		}
		const service = await Service.findById(orderInput.serviceId);
		const subService = await SubService.findById(orderInput.subServiceId);
		if (!service && !subService) {
			const error = new Error(
				"That Service and its SubService are not Found!"
			);
			throw error;
		}
		const order = new Order({
			clientId: user,
			serviceId: service,
			subServiceId: subService,
			description: orderInput.description,
			price: orderInput.price,
			duration: orderInput.duration,
			status: 0,
		});
		const savedOrders = await order.save(); //It needs some Socket.IO
		// pubsub.publish('newOrder', savedOrders);
		const savedOrder = await Order.findOne({ _id: savedOrders._id })
			.populate("clientId")
			.populate("serviceId")
			.populate("subServiceId");
		return {
			...savedOrder._doc,
			_id: savedOrder._id.toString(),
			createdAt: savedOrder.createdAt.toISOString(),
			updatedAt: savedOrder.updatedAt.toISOString(),
		};
	},

	viewOrders: async function ({ userId, yourId }, req) {
		const users = await User.findOne({ _id: yourId });
		const user = await User.findOne({
			$and: [{ _id: userId }, { userType: { $not: { $eq: "Client" } } }],
		});
		if (yourId) {
			if (!users) {
				const error = new Error("A user could not be found.");
				error.code = 401;
				throw error;
			}
			const yourOrders = await Order.find({ clientId: users })
				.sort({ createdAt: -1 })
				.populate("clientId")
				.populate("serviceId")
				.populate("subServiceId");
			const totalOrder = await Order.find({
				clientId: yourId,
			}).countDocuments();
			const totalOrders = await Order.find().countDocuments();
			return {
				orders: yourOrders.map((order) => {
					return {
						...order._doc,
						_id: order._id.toString(),
						createdAt: order.createdAt.toISOString(),
						updatedAt: order.updatedAt.toISOString(),
						duration: order.duration.toISOString(),
					};
				}),
				totalOrders: totalOrders,
				totalOrder: totalOrder,
			};
		}
		if (!user) {
			const error = new Error("A user could not be found.");
			error.code = 401;
			throw error;
		}
		// if (user.userType === "Admin") {
		// 	const orders = await Order.find()
		// 		.sort({ createdAt: -1 })
		// 		.populate("clientId")
		// 		.populate("serviceId")
		// 		.populate("subServiceId");
		// 	const totalOrders = await Order.find().countDocuments();
		// 	return {
		// 		orders: orders.map(order => {
		// 			return {
		// 				...order._doc,
		// 				_id: order._id.toString(),
		// 				createdAt: order.createdAt.toISOString(),
		// 				updatedAt: order.updatedAt.toISOString()
		// 			}
		// 		}),
		// 		totalOrders: totalOrders
		// 	};
		// }
		const orders = await Order.find({
			$or: [
				{ serviceId: user.serviceId },
				{ subServiceId: user.subServiceId },
			],
		})
			.sort({ createdAt: -1 })
			.populate("clientId")
			.populate("serviceId")
			.populate("subServiceId");
		const totalOrder = await Order.find({
			clientId: userId,
		}).countDocuments();
		const totalOrders = await Order.find({
			$or: [
				{ serviceId: user.serviceId },
				{ subServiceId: user.subServiceId },
			],
		}).countDocuments();

		return {
			orders: orders.map((order) => {
				return {
					...order._doc,
					_id: order._id.toString(),
					createdAt: order.createdAt.toISOString(),
					updatedAt: order.updatedAt.toISOString(),
					duration: order.duration.toISOString(),
				};
			}),
			totalOrders: totalOrders,
			totalOrder: totalOrder,
		};
	},

	// This Updating Orders Function
	updateOrder: async function ({ clientId, orderId, orderInput }, req) {
		const order = await Order.findOne({ _id: orderId });
		if (!order) {
			const error = new Error("Order could not be found.");
			error.code = 401;
			throw error;
		}
		if (order.clientId.toString() !== clientId.toString()) {
			const error = new Error(
				"You are not allowed to Updating this Order."
			);
			error.code = 401;
			throw error;
		}
		order.serviceId = orderInput.serviceId;
		order.subServiceId = orderInput.subServiceId;
		order.description = orderInput.description;
		order.price = orderInput.price;
		order.duration = orderInput.duration;
		const savedOrders = await order.save(); //It needs some Socket.IO
		// pubsub.publish('newOrder', savedOrders);
		const savedOrder = await Order.findOne({ _id: savedOrders._id })
			.populate("clientId")
			.populate("serviceId")
			.populate("subServiceId");
		return {
			...savedOrder._doc,
			_id: savedOrder._id.toString(),
			createdAt: savedOrder.createdAt.toISOString(),
			updatedAt: savedOrder.updatedAt.toISOString(),
		};
	},

	// This Deleting Orders Function
	deleteOrder: async function ({ clientId, orderId }, req) {
		const order = await Order.findOne({ _id: orderId });
		if (!order) {
			const error = new Error("Unable to Found That Bid.");
			error.code = 401;
			throw error;
		}
		if (order.clientId.toString() !== clientId.toString()) {
			const error = new Error("You are not allowed to Delete this Bid.");
			error.code = 401;
			throw error;
		}
		await Order.findByIdAndRemove(orderId); // it needs some Socket.IO
		return true;
	},
	//This is New Orders for Workers Function
	viewNewOrders: async function ({ userId }, req) {
		const user = await User.findOne({ _id: userId });
		if (!user) {
			const error = new Error("A user could not be found.");
			error.code = 401;
			throw error;
		}
		if (user.userType === "Worker") {
			const newOrders = await Order.find({
				$and: [
					{
						$or: [
							{ serviceId: user.serviceId },
							{ subServiceId: { $in: user.subServiceId } },
						],
					},
					{ status: 0 },
				],
			})
				.sort({ createdAt: -1 })
				.populate("clientId")
				.populate("serviceId")
				.populate("subServiceId");
			const totalNewOrders = await Order.find({
				$and: [
					{
						$or: [
							{ serviceId: user.serviceId },
							{ subServiceId: { $in: user.subServiceId } },
						],
					},
					{ status: 0 },
				],
			}).countDocuments();
			return {
				newOrders: newOrders.map((newOrder) => {
					return {
						...newOrder._doc,
						_id: newOrder._id.toString(),
						createdAt: newOrder.createdAt.toISOString(),
						updatedAt: newOrder.updatedAt.toISOString(),
					};
				}),
				totalNewOrders: totalNewOrders,
			};
		} else {
			const error = new Error("Couldn't Perform Action.");
			error.code = 500;
			throw error;
		}
	},

	// This is creating a Bid Function
	createBid: async function ({ orderId, workerId, bidInput }, req) {
		const user = await User.findOne({ _id: workerId });

		if (!user) {
			const error = new Error("A user could not be found.");
			error.code = 401;
			throw error;
		}
		const order = await Order.findOne({ _id: orderId });
		if (!order) {
			const error = new Error("That Order could not be found.");
			error.code = 401;
			throw error;
		}
		if (new Date(bidInput.duration) < new Date(order.createdAt)) {
			const error = new Error(
				"Your Bid's duration is Less Than Order's creation Date."
			);
			error.code = 401;
			throw error;
		}
		if (order.clientId.toString() === workerId.toString()) {
			const error = new Error("You Cannot order and bid yourself.");
			error.code = 401;
			throw error;
		}
		if (user.serviceId.toString() !== order.serviceId.toString()) {
			const error = new Error(
				"You are Not Allowed to serve that Service!"
			);
			error.code = 401;
			throw error;
		}
		const existingBids = await Bid.findOne({
			$and: [{ orderId: order._id }, { workerId: user._id }],
		});
		if (existingBids) {
			const error = new Error(
				"You are not Allowed to Bid more than once on one order!"
			);
			throw error;
		}
		const bids = new Bid({
			orderId: order,
			workerId: user,
			price: bidInput.price,
			description: bidInput.description,
			duration: bidInput.duration,
			status: 0,
		});
		const updatedBid = await bids.save(); //It needs some Socket.IO

		return {
			...updatedBid._doc,
			id: updatedBid._id.toString(),
			createdAt: updatedBid.createdAt.toISOString(),
			updatedAt: updatedBid.updatedAt.toISOString(),
		};
	},

	// view bids on your offer
	viewOfferBids: async function ({ clientId, offerId }, req) {
		const user = await Order.find({
			$and: [{ clientId: clientId }, { _id: offerId }],
		});
		if (!user) {
			const error = new Error("A user could not be found.");
			error.code = 401;
			throw error;
		}
		//const orderId = await Bid.findOne({ orderId: offerId })
		const offerBid = await Bid.find({ orderId: user })
			.sort({ createdAt: -1 })
			.populate({
				path: "orderId",
				model: "Order",
				populate: [
					{
						path: "serviceId",
					},
					{
						path: "subServiceId",
					},
				],
			})
			.populate({
				path: "workerId",
				model: "User",
				populate: [
					{
						path: "serviceId",
					},
					{
						path: "subServiceId",
					},
				],
			});
		if (!offerBid) {
			const error = new Error("No one Bidded to this Order");
			error.code = 401;
			throw error;
		}
		if (offerBid <= 0) {
			const error = new Error("No one Bidded to this Order");
			error.code = 401;
			throw error;
		}
		const totalBids = await Bid.find({
			$and: [{ orderId: offerId }, { status: 0 }],
		}).countDocuments();
		return {
			offerBid: offerBid.map((item) => {
				return {
					...item._doc,
					id: item._id.toString(),
					createdAt: item.createdAt.toISOString(),
					updatedAt: item.updatedAt.toISOString(),
					duration: item.duration.toISOString(),
				};
			}),
			totalBids: totalBids,
		};
	},

	// Accept Bid Function
	acceptBid: async function ({ _id }, req) {
		const bid = await Bid.findOne({ _id: _id });
		const order = await Order.findOne({ _id: bid.orderId });
		if (!bid || !order) {
			const error = new Error("Bid could not be Found.");
			error.code = 401;
			throw error;
		}
		if (bid.status == 1 || order.status == 1) {
			const error = new Error("Bid could not be Accepted Twice.");
			error.code = 401;
			throw error;
		}
		order.status = 1;
		bid.status = 1;
		await order.save();
		await bid.save(); // It needs some Socket.IO
		return {
			...bid._doc,
			_id: bid._id.toString(),
			createdAt: bid.createdAt.toISOString(),
			updatedAt: bid.updatedAt.toISOString(),
		};
	},

	//Worker Bids Function
	workerBids: async function ({ workerId }, req) {
		const worker = await Bid.find({ workerId: workerId }).sort({
			createdAt: -1,
		});
		const totalBids = await Bid.find({
			workerId: workerId,
		}).countDocuments();
		if (!worker) {
			const error = new Error("A user could not be found.");
			error.code = 401;
			throw error;
		}
		return {
			offerBid: worker.map((item) => {
				return {
					...item._doc,
					createdAt: item.createdAt.toISOString(),
					updatedAt: item.updatedAt.toISOString(),
				};
			}),
			totalBids: totalBids,
		};
	},

	// Updated Bids Function
	updatedBid: async function ({ workerId, bidId, bidInput }, req) {
		const bid = await Bid.findOne({ _id: bidId });
		if (!bid) {
			const error = new Error("Unable to Found That Bid.");
			error.code = 401;
			throw error;
		}
		if (bid.workerId.toString() !== workerId.toString()) {
			const error = new Error("You are not allowed to Update this Bid.");
			error.code = 401;
			throw error;
		}
		if (bid.status === 1) {
			const error = new Error(
				"You are not allowed to Update Submitted Bid."
			);
			error.code = 401;
			throw error;
		}
		bid.price = bidInput.price;
		bid.description = bidInput.description;
		bid.duration = bidInput.duration;
		const updatedBid = await bid.save(); //It needs some Socket.IO
		return {
			...updatedBid._doc,
			id: updatedBid._id.toString(),
			createdAt: updatedBid.createdAt.toISOString(),
			updatedAt: updatedBid.updatedAt.toISOString(),
		};
	},
	deleteBid: async function ({ workerId, bidId }, req) {
		const bid = await Bid.findOne({ _id: bidId });
		if (!bid) {
			const error = new Error("Unable to Found That Bid.");
			error.code = 401;
			throw error;
		}
		if (bid.workerId.toString() !== workerId.toString()) {
			const error = new Error("You are not allowed to Delete this Bid.");
			error.code = 401;
			throw error;
		}
		await Bid.findByIdAndRemove(bidId); // it needs some Socket.IO
		return true;
	},
	createCart: async function ({ clientId, cartInputs }, req) {
		let saveCart;
		const user = await User.findOne({ _id: clientId });
		const date = new Date();
		var cart = await Cart.findOne({ clientId: clientId });
		if (new Date(cartInputs.duration) < date) {
			const error = new Error("Your Duration is Less Than ToDay.");
			error.code = 401;
			throw error;
		}
		if (!user) {
			const error = new Error("Unable to Found This Account.");
			error.code = 401;
			throw error;
		}
		const service = await Service.findById(cartInputs.serviceId);
		const subService = await SubService.findById(cartInputs.subServiceId);
		if (!service && !subService) {
			const error = new Error(
				"That Service and its SubService are not Found!"
			);
			throw error;
		}

		if (cart) {
			const check = cart.orders.map((item, key) =>
				key === 0 &&
				item.subServiceId.toString() === subService._id.toString()
					? true
					: null
			);
			if (check[0] === true) {
				const error = new Error("That Service is already in the Cart!");
				throw error;
			}
			cart.orders.push({
				clientId: [user._id],
				serviceId: [service._id],
				subServiceId: [subService._id],
				description: cartInputs.description,
				price: cartInputs.price,
				duration: cartInputs.duration,
			});
			saveCart = await cart.save();
		} else {
			cart = new Cart({
				clientId: clientId,
				orders: [
					{
						clientId: [user._id],
						serviceId: [service._id],
						subServiceId: [subService._id],
						description: cartInputs.description,
						price: cartInputs.price,
						duration: cartInputs.duration,
					},
				],
			});
			saveCart = await cart.save();
		}

		// const saveCart = await cart.save(); //It needs some Socket.IO
		// pubsub.publish('newOrder', savedOrders);
		const savedCart = await Cart.findOne({ _id: saveCart._id })
			.populate({
				path: "orders.serviceId",
				model: "Service",
			})
			.populate({
				path: "orders.clientId",
				model: "User",
			})
			.populate({
				path: "orders.subServiceId",
				model: "SubService",
			});
		return {
			...savedCart._doc,
			_id: savedCart._id.toString(),
			createdAt: savedCart.createdAt.toISOString(),
			updatedAt: savedCart.updatedAt.toISOString(),
		};
	},
	updateCart: async function ({ cartId, cartInputs }, req) {
		let saveCart;
		const user = await User.findOne({ _id: cartInputs.clientId });
		const date = new Date();
		var cart = await Cart.findOne({ _id: cartId });
		if (new Date(cartInputs.duration) < date) {
			const error = new Error("Your Duration is Less Than ToDay.");
			error.code = 401;
			throw error;
		}
		if (!user) {
			const error = new Error("You are not allowed to Change this Cart");
			error.code = 401;
			throw error;
		}
		const service = await Service.findById(cartInputs.serviceId);
		const subService = await SubService.findById(cartInputs.subServiceId);
		if (!service || !subService) {
			const error = new Error(
				"That Service and its SubService are not Found!"
			);
			throw error;
		}
		if (!cart) {
			const error = new Error("Cart not Found");
			error.code = 401;
			throw error;
		}
		const check = await Cart.updateMany(
			{
				orders: {
					$elemMatch: {
						clientId: mongoose.Types.ObjectId(cartInputs.clientId),
						serviceId: mongoose.Types.ObjectId(service._id),
						subServiceId: mongoose.Types.ObjectId(subService._id),
					},
				},
			},
			{
				$set: {
					"orders.$.price": cartInputs.price,
					"orders.$.duration": cartInputs.duration,
					"orders.$.description": cartInputs.description,
				},
			}
		);
		// if (check) {
		// const saveCart = await cart.save(); //It needs some Socket.IO
		// pubsub.publish('newOrder', savedOrders);
		const savedCart = await Cart.findOne({ _id: cartId })
			.populate({
				path: "orders.serviceId",
				model: "Service",
			})
			.populate({
				path: "orders.clientId",
				model: "User",
			})
			.populate({
				path: "orders.subServiceId",
				model: "SubService",
			});
		return {
			...savedCart._doc,
			_id: savedCart._id.toString(),
			createdAt: savedCart.createdAt.toISOString(),
			updatedAt: savedCart.updatedAt.toISOString(),
		};
		// }
	},
	deleteCart: async function (
		{ clientId, cartId, serviceId, subServiceId },
		req
	) {
		const user = await User.findOne({ _id: clientId });
		var cart = await Cart.findOne({ _id: cartId });
		if (!user) {
			const error = new Error("You are not allowed to Delete this Cart");
			error.code = 401;
			throw error;
		}
		const service = await Service.findById(serviceId);
		const subService = await SubService.findById(subServiceId);
		if (!service || !subService) {
			const error = new Error(
				"That Service and its SubService are not Found in Your Cart!"
			);
			throw error;
		}
		if (!cart) {
			const error = new Error("Cart not Found");
			error.code = 401;
			throw error;
		}
		const check = await Cart.updateMany(
			{
				$orders: {
					$elemMatch: {
						serviceId: mongoose.Types.ObjectId(service._id),
						subServiceId: mongoose.Types.ObjectId(subService._id),
						clientId: mongoose.Types.ObjectId(user._id),
					},
				},
			},
			{
				$pull: {
					orders: {
						serviceId: service._id,
						subServiceId: subService._id,
						clientId: user._id,
					},
				},
			},
			{ multi: true }
		);
		const savedCart = await Cart.findOne({
			$and: [{ _id: cartId }, { clientId: userId }],
		})
			.populate({
				path: "orders.serviceId",
				model: "Service",
			})
			.populate({
				path: "orders.clientId",
				model: "User",
			})
			.populate({
				path: "orders.subServiceId",
				model: "SubService",
			});
		return {
			...savedCart._doc,
			_id: savedCart._id.toString(),
			createdAt: savedCart.createdAt.toISOString(),
			updatedAt: savedCart.updatedAt.toISOString(),
		};
	},
	getCart: async function ({ clientId }, req) {
		const savedCart = await Cart.findOne({ clientId: clientId })
			.populate({
				path: "orders.serviceId",
				model: "Service",
			})
			.populate({
				path: "orders.clientId",
				model: "User",
			})
			.populate({
				path: "orders.subServiceId",
				model: "SubService",
			});
		return {
			...savedCart._doc,
			_id: savedCart._id.toString(),
			createdAt: savedCart.createdAt.toISOString(),
			updatedAt: savedCart.updatedAt.toISOString(),
		};
	},
	cartOrder: async function ({ clientId, cartId }, req) {
		const user = await User.findOne({ _id: clientId });
		if (!user) {
			const error = new Error("Unable to Order That Order.");
			error.code = 401;
			throw error;
		}
		var cart = await Cart.findOne({
			$and: [{ clientId: user._id }, { _id: cartId }],
		});
		if (!cart) {
			const error = new Error("Cart not Found.");
			error.code = 401;
			throw error;
		}
		var savedOrders = [];
		var saved;
		for (var i = 0; i < cart.orders.length; i++) {
			const order = new Order({
				clientId: cart.orders[i].clientId,
				serviceId: cart.orders[i].serviceId,
				subServiceId: cart.orders[i].subServiceId,
				description: cart.orders[i].description,
				price: cart.orders[i].price,
				duration: cart.orders[i].duration,
				status: 0,
			});
			saved = await order.save(); //It needs some Socket.IO
			savedOrders.push(saved);
		}
		const cartDelete = await Cart.findByIdAndRemove(cart._id); // it needs some Socket.IO
		// pubsub.publish('newOrder', savedOrders);
		if (savedOrders && cartDelete) {
			const savedOrder = await Order.find({
				_id: { $in: savedOrders.map((item) => item._id) },
			})
				.populate({ path: "clientId", model: "User" })
				.populate({ path: "serviceId", model: "Service" })
				.populate({ path: "subServiceId", model: "SubService" });

			return {
				orders: savedOrder.map((item) => {
					return {
						...item._doc,
						id: item._id.toString(),
						createdAt: item.createdAt.toISOString(),
						updatedAt: item.updatedAt.toISOString(),
						duration: item.duration.toISOString(),
					};
				}),
			};
		}
	},
	// somethingChanged: {
	//   subscribe: () => pubsub.asyncIterator('newOrder')
	// }
};

// type Addresses {
// 		province: String
// 		district: String
// 		sector: String
// 	}
// address: Addresses!
// input Address {
// 		province: String!
// 		district: String!
// 		sector: String!
// 	}
