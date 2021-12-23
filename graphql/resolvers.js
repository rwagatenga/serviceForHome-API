const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
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
	/** Query Part */
	Query: {
		/** Function of Login Functionality */
		login: async function (args, req) {
			console.log("REQ", req)
			const email = req.email;
			const password = req.password;
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
			user.location = {
				latitude: req.location.latitude,
				longitude: req.location.longitude,
			};
			await user.save();
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

		/** This is Viewing all Services Function */
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

		/** This is Function of View all SubServices */
		viewSubServices: async function (args, req) {
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

		/** View Orders */
		viewOrders: async function (args, { userId, yourId }, req) {
			const users = await User.findOne({ _id: yourId });
			const user = await User.findOne({
				$and: [
					{ _id: userId },
					{ userType: { $not: { $eq: "Client" } } },
				],
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
					clientId: req.yourId,
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
		/** This is New Orders for Workers Function */
		viewNewOrders: async function (args, { userId }, req) {
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
		/** view bids on your offer */
		viewOfferBids: async function (args, { clientId, offerId }, req) {
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
		/** Get Cart Function */
		getCart: async function (args, { clientId }, req) {
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

			if (!savedCart || savedCart.length < 1) {
				const error = new Error("Your Cart is Empty.");
				error.data = error;
				error.code = 422;
				throw error;
			}
			return {
				...savedCart._doc,
				_id: savedCart._id.toString(),
				createdAt: savedCart.createdAt.toISOString(),
				updatedAt: savedCart.updatedAt.toISOString(),
			};
		},
	},

	/** Mutation Part */
	Mutation: {
		/** This Create Service Function */
		createService: async function (
			parent,
			{ serviceData },
			{ pubsub },
			req
		) {
			console.log("SERVICE", serviceData.serviceName);
			const errors = [];

			if (
				serviceData.serviceName == null ||
				serviceData.serviceName == ""
			) {
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

			pubsub.publish("service", {
				service: {
					mutation: "SERVICE_CREATED",
					data: {
						...services._doc,
						_id: services._id.toString(),
						createdAt: services.createdAt.toISOString(),
						updatedAt: service.updatedAt.toISOString(),
					},
				},
			});
			return {
				...services._doc,
				_id: services._id.toString(),
				createdAt: services.createdAt.toISOString(),
				updatedAt: service.updatedAt.toISOString(),
			};
		},

		/** Updating Service Function */
		updateService: async function (
			parent,
			{ id, serviceInput },
			{ pubsub },
			req
		) {
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
			const service_push = {
				...updatedService._doc,
				_id: updatedService._id.toString(),
				createdAt: updatedService.createdAt.toISOString(),
				updatedAt: updatedService.updatedAt.toISOString(),
			};
			pubsub.publish("service", {
				service: {
					mutation: "SERVICE_UPDATED",
					data: { ...service_push },
				},
			});
			return {
				...updatedService._doc,
				_id: updatedService._id.toString(),
				createdAt: updatedService.createdAt.toISOString(),
				updatedAt: updatedService.updatedAt.toISOString(),
			};
		},

		/** Delete a Service Function */
		deleteService: async function (parent, { id }, { pubsub }, req) {
			console.log("ID", id);
			const service = await Service.findById(id);
			if (!service) {
				const error = new Error("That Service not Found!");
				error.code = 404;
				throw error;
			}
			const deletedSubService = await SubService.deleteMany({
				service: service._id,
			});
			const deletedService = await Service.findByIdAndRemove(id); //It needs some Socket.IO
			// const user = await User.findById(req.userId);
			// user.posts.pull(id);
			// await user.save();
			if (deletedSubService && deletedService) {
				const service_push = {
					...deletedService._doc,
					_id: deletedService._id.toString(),
					createdAt: deletedService.createdAt.toISOString(),
					updatedAt: deletedService.updatedAt.toISOString(),
				};
				pubsub.publish("service", {
					service: {
						mutation: "SERVICE_DELETED",
						data: { ...service_push },
					},
				});
				return true;
			} else {
				const error = new Error("No Service found!");
				error.code = 404;
				throw error;
			}
		},

		/** Creating SubService Function */
		createSubService: async function (
			parent,
			{ id, subServiceData },
			{ pubsub },
			req
		) {
			const service = await Service.findById(id);
			const errors = [];

			if (
				subServiceData.subServiceName == null ||
				subServiceData.subServiceName == ""
			) {
				errors.push({ message: "Please Insert SubService Name" });
			}
			if (
				!validator.isLength(subServiceData.subServiceName, { min: 3 })
			) {
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
					message:
						"Can't Insert SubService without its Service Category",
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

			const subService_push = {
				...data._doc,
				_id: data._id.toString(),
				createdAt: data.createdAt.toISOString(),
				updatedAt: data.updatedAt.toISOString(),
			};

			pubsub.publish("subService", {
				subService: {
					mutation: "SUBSERVICE_CREATED",
					data: { ...subService_push },
				},
			});
			return {
				...data._doc,
				_id: data._id.toString(),
				createdAt: data.createdAt.toISOString(),
				updatedAt: data.updatedAt.toISOString(),
			};
		},

		/** Updating SubService Function */
		updateSubService: async function (
			parent,
			{ id, subServiceInput },
			{ pubsub },
			req
		) {
			const subService = await SubService.findById(id).populate(
				"serviceId"
			);
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
			const data = await SubService.findById(
				updatedSubService._id
			).populate("serviceId");

			const subService_push = {
				...updatedSubService._doc,
				_id: updatedSubService._id.toString(),
				createdAt: updatedSubService.createdAt.toISOString(),
				updatedAt: updatedSubService.updatedAt.toISOString(),
			};

			pubsub.publish("subService", {
				subService: {
					mutation: "SUBSERVICE_UPDATED",
					data: {
						...data._doc,
						_id: data._id.toString(),
						createdAt: data.createdAt.toISOString(),
						updatedAt: data.updatedAt.toISOString(),
					},
				},
			});
			return {
				...data._doc,
				_id: data._id.toString(),
				createdAt: data.createdAt.toISOString(),
				updatedAt: data.updatedAt.toISOString(),
			};
		},

		/** Deleting SubService Function */
		deleteSubService: async function (parent, { id }, { pubsub }, req) {
			const subService = await SubService.findById(id);
			if (!subService) {
				const error = new Error("That SubService found!");
				error.code = 404;
				throw error;
			}
			const service = await Service.findById(subService.serviceId); //It needs some Socket.IO
			service.subServiceId.pull(id);
			const deletedService = await service.save();
			const deletedSubService = await SubService.findByIdAndRemove(id);
			if (deletedService && deletedSubService) {
				const subService_push = {
					...deletedSubService._doc,
					_id: deletedSubService._id.toString(),
					createdAt: deletedSubService.createdAt.toISOString(),
					updatedAt: deletedSubService.updatedAt.toISOString(),
				};
				pubsub.publish("subService", {
					subService: {
						mutation: "SUBSERVICE_DELETED",
						data: { ...subService_push },
					},
				});
				return true;
			} else {
				const error = new Error("No SubService found!");
				error.code = 404;
				throw error;
			}
		},

		/** Creating User Account Function */
		createUser: async function (
			parent,
			{ token, expiresIn, serviceId, subServiceId, userInput },
			{ pubsub },
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

			let userPush;

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
					location: {
						latitude: userInput.location.latitude,
						longitude: userInput.location.longitude
					}
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
				userPush = {
					...createdUser._doc,
					_id: createdUser._id.toString(),
					createdAt: createdUser.createdAt.toISOString(),
					updatedAt: createdUser.updatedAt.toISOString(),
					token: token,
					expiresIn: expiresIn,
				};
				pubsub.publish("users", {
					users: {
						mutation: "USER_CREATED",
						data: { ...userPush },
					},
				});
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
					const error = new Error(
						"That Service no longer available!"
					);
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
					location: {
						latitude: userInput.location.latitude,
						longitude: userInput.location.longitude
					},
					serviceId: service,
					subServiceId: subService,
					priceTag: userInput.priceTag,
					negotiate: userInput.negotiate,
					status: 1,
				});
				const createdUsers = await user.save();
				const createdUser = await User.findOne({
					_id: createdUsers._id,
				})
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
				userPush = {
					...createdUser._doc,
					_id: createdUser._id.toString(),
					createdAt: createdUser.createdAt.toISOString(),
					updatedAt: createdUser.updatedAt.toISOString(),
					token: token,
					expiresIn: expiresIn,
				};
				pubsub.publish("users", {
					users: {
						mutation: "USER_CREATED",
						data: { ...userPush },
					},
				});
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

		/** Updating User Account */
		updateUser: async function (
			parent,
			{ userId, serviceId, subServiceId, userInput },
			{ pubsub },
			req
		) {
			console.log("USER", userInput);
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

			let userPush;

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
				user.location = {
					latitude: userInput.location.latitude,
					longitude: userInput.location.longitude
				}

				const updatedUser = await user.save(); //It needs some Socket.IO
				userPush = {
					...updatedUser._doc,
					_id: updatedUser._id.toString(),
					createdAt: updatedUser.createdAt.toISOString(),
					updatedAt: updatedUser.updatedAt.toISOString(),
				};
				pubsub.publish("users", {
					users: {
						mutation: "USER_UPDATED",
						data: { ...userPush },
					},
				});
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
				user.location = {
					latitude: userInput.location.latitude,
					longitude: userInput.location.longitude
				}
				user.serviceId = service;
				user.subServiceId = subService;
				user.priceTag = userInput.priceTag;
				user.negotiate = userInput.negotiate;

				const updatedUser = await user.save();
				userPush = {
					...updatedUser._doc,
					_id: updatedUser._id.toString(),
					createdAt: updatedUser.createdAt.toISOString(),
					updatedAt: updatedUser.updatedAt.toISOString(),
				};
				pubsub.publish("users", {
					users: {
						mutation: "USER_UPDATED",
						data: { ...userPush },
					},
				});
				return {
					...updatedUser._doc,
					_id: updatedUser._id.toString(),
					createdAt: updatedUser.createdAt.toISOString(),
					updatedAt: updatedUser.updatedAt.toISOString(),
				};
			}
		},

		/** Create Cart */
		createCart: async function (
			parent,
			{ clientId, cartInputs },
			{ pubsub },
			req
		) {
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
			const subService = await SubService.findById(
				cartInputs.subServiceId
			);
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
					const error = new Error(
						"That Service is already in the Cart!"
					);
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

			cartPush = {
				...savedCart._doc,
				_id: savedCart._id.toString(),
				createdAt: savedCart.createdAt.toISOString(),
				updatedAt: savedCart.updatedAt.toISOString(),
			};
			pubsub.publish("carts", {
				carts: {
					mutation: "CART_CREATED",
					data: { ...cartPush },
				},
			});
			return {
				...savedCart._doc,
				_id: savedCart._id.toString(),
				createdAt: savedCart.createdAt.toISOString(),
				updatedAt: savedCart.updatedAt.toISOString(),
			};
		},

		/** Update Cart */
		updateCart: async function (
			parent,
			{ cartId, cartInputs },
			{ pubsub },
			req
		) {
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
				const error = new Error(
					"You are not allowed to Change this Cart"
				);
				error.code = 401;
				throw error;
			}
			const service = await Service.findById(cartInputs.serviceId);
			const subService = await SubService.findById(
				cartInputs.subServiceId
			);
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
							clientId: mongoose.Types.ObjectId(
								cartInputs.clientId
							),
							serviceId: mongoose.Types.ObjectId(service._id),
							subServiceId: mongoose.Types.ObjectId(
								subService._id
							),
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
			cartPush = {
				...savedCart._doc,
				_id: savedCart._id.toString(),
				createdAt: savedCart.createdAt.toISOString(),
				updatedAt: savedCart.updatedAt.toISOString(),
			};
			pubsub.publish("carts", {
				carts: {
					mutation: "CART_UPDATED",
					data: { ...cartPush },
				},
			});
			return {
				...savedCart._doc,
				_id: savedCart._id.toString(),
				createdAt: savedCart.createdAt.toISOString(),
				updatedAt: savedCart.updatedAt.toISOString(),
			};
		},

		/** Delete Cart */
		deleteCart: async function (parent,
			{ clientId, cartId, serviceId, subServiceId },
			{pubsub},
			req
		) {
			const user = await User.findOne({ _id: clientId });
			var cart = await Cart.findOne({ _id: cartId });
			if (!user) {
				const error = new Error(
					"You are not allowed to Delete this Cart"
				);
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
					orders: {
						$elemMatch: {
							serviceId: mongoose.Types.ObjectId(service._id),
							subServiceId: mongoose.Types.ObjectId(
								subService._id
							),
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
				$and: [{ _id: cartId }, { clientId: user._id }],
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
			cartPush = {
				...savedCart._doc,
				_id: savedCart._id.toString(),
				createdAt: savedCart.createdAt.toISOString(),
				updatedAt: savedCart.updatedAt.toISOString(),
			};
			pubsub.publish("carts", {
				carts: {
					mutation: "CART_DELETED",
					data: { ...cartPush },
				},
			});
			return {
				...savedCart._doc,
				_id: savedCart._id.toString(),
				createdAt: savedCart.createdAt.toISOString(),
				updatedAt: savedCart.updatedAt.toISOString(),
			};
		},

		/** Cart Order */
		cartOrder: async function (
			parent,
			{ clientId, cartId },
			{ pubsub },
			req
		) {
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
				orderPush = {
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
				pubsub.publish("orders", {
					orders: {
						mutation: "ORDER_CREATED",
						data: { ...orderPush },
					},
				});
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

		/** Create Order */
		createOrders: async function (
			parent,
			{ clientId, orderInput },
			{ pubsub },
			req
		) {
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
			const subService = await SubService.findById(
				orderInput.subServiceId
			);
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
			orderPush = {
				...savedOrder._doc,
				_id: savedOrder._id.toString(),
				createdAt: savedOrder.createdAt.toISOString(),
				updatedAt: savedOrder.updatedAt.toISOString(),
			};
			pubsub.publish("orders", {
				orders: {
					mutation: "ORDER_CREATED",
					data: { ...orderPush },
				},
			});
			return {
				...savedOrder._doc,
				_id: savedOrder._id.toString(),
				createdAt: savedOrder.createdAt.toISOString(),
				updatedAt: savedOrder.updatedAt.toISOString(),
			};
		},

		/** Update Order */
		updateOrder: async function (
			parent,
			{ clientId, orderId, orderInput },
			{ pubsub },
			req
		) {
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
			orderPush = {
				...savedOrder._doc,
				_id: savedOrder._id.toString(),
				createdAt: savedOrder.createdAt.toISOString(),
				updatedAt: savedOrder.updatedAt.toISOString(),
			};
			pubsub.publish("orders", {
				orders: {
					mutation: "ORDER_UPDATED",
					data: { ...orderPush },
				},
			});
			return {
				...savedOrder._doc,
				_id: savedOrder._id.toString(),
				createdAt: savedOrder.createdAt.toISOString(),
				updatedAt: savedOrder.updatedAt.toISOString(),
			};
		},

		/** Delete Order */
		deleteOrder: async function (
			parent,
			{ clientId, orderId },
			{ pubsub },
			req
		) {
			const order = await Order.findOne({ _id: orderId });
			if (!order) {
				const error = new Error("Unable to Found That Bid.");
				error.code = 401;
				throw error;
			}
			if (order.clientId.toString() !== clientId.toString()) {
				const error = new Error(
					"You are not allowed to Delete this Bid."
				);
				error.code = 401;
				throw error;
			}
			const savedOrder = await Order.findByIdAndRemove(orderId); // it needs some Socket.IO
			if (savedOrder) {
				orderPush = {
					...savedOrder._doc,
					_id: savedOrder._id.toString(),
					createdAt: savedOrder.createdAt.toISOString(),
					updatedAt: savedOrder.updatedAt.toISOString(),
				};
				pubsub.publish("orders", {
					orders: {
						mutation: "ORDER_DELETED",
						data: { ...orderPush },
					},
				});
				return true;
			} else {
				const error = new Error("Order does not found!");
				error.code = 404;
				throw error;
			}
		},

		/** Create Bid */
		createBid: async function (
			parent,
			{ orderId, workerId, bidInput },
			{ pubsub },
			req
		) {
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
			const bidPush = {
				...updatedBid._doc,
				id: updatedBid._id.toString(),
				createdAt: updatedBid.createdAt.toISOString(),
				updatedAt: updatedBid.updatedAt.toISOString(),
			};
			pubsub.publish("bids", {
				bids: {
					mutation: "BID_CREATED",
					data: { ...bidPush },
				},
			});
			return {
				...updatedBid._doc,
				id: updatedBid._id.toString(),
				createdAt: updatedBid.createdAt.toISOString(),
				updatedAt: updatedBid.updatedAt.toISOString(),
			};
		},

		/** Accept Bid */
		acceptBid: async function (parent, { _id }, { pubsub }, req) {
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
			const bidSaved = await bid.save(); // It needs some Socket.IO
			const bidPush = {
				...bidSaved._doc,
				id: bidSaved._id.toString(),
				createdAt: bidSaved.createdAt.toISOString(),
				updatedAt: bidSaved.updatedAt.toISOString(),
			};
			pubsub.publish("bids", {
				bids: {
					mutation: "BID_ACCEPTED",
					data: { ...bidPush },
				},
			});
			return {
				...bidSaved._doc,
				_id: bidSaved._id.toString(),
				createdAt: bidSaved.createdAt.toISOString(),
				updatedAt: bidSaved.updatedAt.toISOString(),
			};
		},

		/** Update Bid */
		updatedBid: async function (
			parent,
			{ workerId, bidId, bidInput },
			{ pubsub },
			req
		) {
			const bid = await Bid.findOne({ _id: bidId });
			if (!bid) {
				const error = new Error("Unable to Found That Bid.");
				error.code = 401;
				throw error;
			}
			if (bid.workerId.toString() !== workerId.toString()) {
				const error = new Error(
					"You are not allowed to Update this Bid."
				);
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
			const bidPush = {
				...updatedBid._doc,
				id: updatedBid._id.toString(),
				createdAt: updatedBid.createdAt.toISOString(),
				updatedAt: updatedBid.updatedAt.toISOString(),
			};
			pubsub.publish("bids", {
				bids: {
					mutation: "BID_UPDATED",
					data: { ...bidPush },
				},
			});
			return {
				...updatedBid._doc,
				id: updatedBid._id.toString(),
				createdAt: updatedBid.createdAt.toISOString(),
				updatedAt: updatedBid.updatedAt.toISOString(),
			};
		},

		/** Delete Bid */
		deleteBid: async function (parent, { workerId, bidId }, {pubsub}, req) {
			const bid = await Bid.findOne({ _id: bidId });
			if (!bid) {
				const error = new Error("Unable to Found That Bid.");
				error.code = 401;
				throw error;
			}
			if (bid.workerId.toString() !== workerId.toString()) {
				const error = new Error(
					"You are not allowed to Delete this Bid."
				);
				error.code = 401;
				throw error;
			}
			const bids = await Bid.findByIdAndRemove(bidId); // it needs some Socket.IO
			if (bids) {
				const bidPush = {
					...updatedBid._doc,
					id: updatedBid._id.toString(),
					createdAt: updatedBid.createdAt.toISOString(),
					updatedAt: updatedBid.updatedAt.toISOString(),
				};
				pubsub.publish("bids", {
					bids: {
						mutation: "BID_UPDATED",
						data: { ...bidPush },
					},
				});
				return true;
			} else {
				const error = new Error("Bid does not found!");
				error.code = 404;
				throw error;
			}
		},
	},

	/** Subscription Part */
	Subscription: {
		service: {
			subscribe(parent, args, { pubsub }) {
				return pubsub.asyncIterator("service");
			},
		},
		subService: {
			subscribe(parent, args, { pubsub }) {
				return pubsub.asyncIterator("subService");
			},
		},
		users: {
			subscribe(parent, args, { pubsub }) {
				return pubsub.asyncIterator("users");
			},
		},
		carts: {
			subscribe(parent, args, { pubsub }) {
				return pubsub.asyncIterator("carts");
			},
		},
		orders: {
			subscribe(parent, args, { pubsub }) {
				return pubsub.asyncIterator("orders");
			},
		},
		bids: {
			subscribe(parent, args, { pubsub }) {
				return pubsub.asyncIterator("bids");
			},
		},
	},
};

module.exports = resolvers;
