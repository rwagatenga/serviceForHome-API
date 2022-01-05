//type definitions - schemas (operation and data strcutures)

const typeDefs = `
	type Query{
		login(email: String!, password: String!, location: LocationInput!): AuthData!
		viewServices: servicesData!
		viewSubServices: subServicesData!
		viewOrders(userId: ID!, yourId: ID): ordersData!
		viewNewOrders(userId: ID!): newOrdersData!
		viewOfferBids(clientId: ID!, offerId: ID!): offerBids!
		workerBids(workerId: ID!): offerBids!
		getCart(clientId: ID!): Cart!
		viewUsers: usersData!
		checkPayment(transactionId: String): Connection!
		viewDashboard: Dashboard!
	}
	type Mutation{
		payingFee(payment: PayConnections): Connection!
		createService(serviceData: insertService): Service!
		updateService(id: ID!, serviceInput: insertService): Service!
        deleteService(id: ID!): Boolean

		createSubService(id: ID!, subServiceData: insertSubService): SubService!
		updateSubService(id: ID!, subServiceInput: insertSubService): SubService!
        deleteSubService(id: ID!): Boolean

        createUser(token: String, expiresIn: Int, serviceId: ID, subServiceId: [ID], userInput: userInputData): User!
        updateUser(userId: ID!, serviceId: ID, subServiceId: [ID], userInput: userInputData): User!

        createCart(clientId: ID! cartInputs: cartInputData): Cart!
        updateCart(cartId: ID! cartInputs: cartInputData): Cart!
        cartOrder(clientId: ID!, cartId: ID!): ordersData!
        deleteCart(clientId: ID! cartId: ID! serviceId: ID! subServiceId: ID!): Cart!

        createOrders(clientId: ID, orderInput: orderInputData): Order!
        updateOrder(clientId: ID!, orderId: ID!, orderInput: orderInputData): Order!
        deleteOrder(clientId: ID!, orderId: ID!): Boolean

        createBid(orderId: ID!, workerId: ID!, bidInput: bidInputData): Bid!
        acceptBid(_id: ID!): Bid!
        updatedBid(workerId: ID!, bidId: ID!, bidInput: bidInputData): Bid!
        deleteBid(workerId: ID!, bidId: ID!): Boolean
	}
	type Dashboard {
		clients: String
		workers: String
		orders: String
	}
	type Service {
		_id: ID!
		serviceName: String!
		subServiceId: [SubService]
		status: Int!
        createdAt: String!
        updatedAt: String!
	}
	type SubService {
		_id: ID!
		subServiceName: String!
		price: String
		photo: String
		serviceId: [Service]
	}
	type Addresses {
		province: String
		district: String
		sector: String
	}
	type Locations {
		latitude: Float!
		longitude: Float!
	}
	type GeoLocation {
		type: String
		coordinates: [Float!]
	}
	type Connection {
		amount: String
		telephoneNumber: String
		transactionId: String
		status: String
		statusCode: String
		statusDescription: String
		paidAmount: String
		responseTimeStamp: String
		callbackUrl: String
		description: String
		code: String
		userId: ID
		paymentStatus: Boolean
		transactionStatus: Boolean
	}
	type User {
		_id: ID!
		firstName: String!
		lastName: String!
		sex: String!
		telephone: String!
		email: String!
		password: String!
		userType: String!
		profile: String
		address: Addresses!
		location: Locations!
		loc: GeoLocation!
		connections: Connection
		serviceId: [Service]
		subServiceId: [SubService]
		distance: Distance
		priceTag: String
		negotiate: String
		status: Int
		workerId: ID
		token: String 
		expiresIn: Int
	}
	type Order {
		_id: ID!
		clientId: [User]
		serviceId: [Service]
		subServiceId: [SubService]
		description: String
		price: String
		duration: String
		status: Int
		createdAt: String
		updatedAt: String
	}
	type Bid {
		_id: ID
		orderId: [Order]
		workerId: [User]
		description: String
		price: String
		duration: String
		distance: Distance
		status: Int
		createdAt: String
		updatedAt: String
	}
	type Carts {
		clientId: [User]
		serviceId: [Service]
		subServiceId: [SubService]
		description: String
		price: String
		duration: String
	}
	type Cart {
		_id: ID!
		clientId: [User]
		orders: [Carts!]!
	}
	input insertService {
		serviceName: String!
		status: Int

	}
	input insertSubService {
		subServiceName: String!
		price: String
		photo: String
	}
	input Address {
		province: String!
		district: String!
		sector: String!
	}
	input LocationInput {
		latitude: Float!
		longitude: Float!
	}
	input GeoLocationInput {
		type: String!
		coordinates: [Float!]
	}
	input PayConnections {
		amount: String
		telephoneNumber: String
		transactionId: String
		status: String
		statusCode: String
		statusDescription: String
		paidAmount: String
		responseTimeStamp: String
		callbackUrl: String
		description: String
		organizationId: String
		userId: ID
	}
	input userInputData {
		firstName: String!
		lastName: String!
		sex: String!
		telephone: String!
		email: String!
		password: String!
		userType: String!
		address: Address!
		location: LocationInput!
		loc: GeoLocationInput!
		connections: PayConnections
		priceTag: String
		negotiate: String
		status: Int
		currentPassword: String
	}
	input orderInputData {
		serviceId: ID!
		subServiceId: ID!
		description: String!
		price: String!
		duration: String!
	}
	input bidInputData {
		price: String
		description: String
		duration: String
		status: Int
		createdAt: String
		updatedAt: String
	}
	input cartInputData {
		clientId: ID!
		subServiceId: ID!
		serviceId: ID!
		description: String!
		price: String!
		duration: String!
	}
	type Distance {
		distance: Float
	}
	type usersData {
		dist: [Distance]
		users: [User!]!
	}
	type servicesData {
		services: [Service!]!
	}
	type subServicesData {
		subServices: [SubService!]!
	}
	type ordersData {
		orders: [Order!]!
		totalOrders: Int
	}
	type newOrdersData {
		newOrders: [Order!]!
		totalNewOrders: Int
	}
	type offerBids {
		offerBid: [Bid]!
		totalBids: Int
		distance: Distance
	}
	type AuthData {
        token: String!
        userId: String!
        userType: String!
        expiresIn: Int
        users: [User!]!
    }
	type Subscription{
		service: ServiceSubscriptionPayload!
		subService: SubServiceSubscriptionPayload!
		users: userSubscriptionPayload!
		carts: cartSubscriptionPayload!
		orders: orderSubscriptionPayload!
		bids: bidSubscriptionPayload!
	}
	type ServiceSubscriptionPayload {
		mutation: String!
		data: Service!
	}
	type SubServiceSubscriptionPayload {
		mutation: String!
		data: SubService!
	}
	type userSubscriptionPayload {
		mutation: String!
		data: User!
	}
	type cartSubscriptionPayload {
		mutation: String!
		data: Cart!
	}
	type orderSubscriptionPayload {
		mutation: String!
		data: Order!
	}
	type bidSubscriptionPayload {
		mutation: String!
		data: Bid!
	}
`;

module.exports = typeDefs;