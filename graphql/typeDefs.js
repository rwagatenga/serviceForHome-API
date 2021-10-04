//type definitions - schemas (operation and data strcutures)

const typeDefs = `
	type Query{
		viewServices: servicesData!
	}
	type Mutation{
		createService(serviceData: insertService): Service!
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
	type servicesData {
		services: [Service!]!
	}
	input insertService {
		serviceName: String!
		status: Int
	}
	type Subscription{
		service: ServiceSubscriptionPayload!
	}
	type ServiceSubscriptionPayload {
		mutation: String!
		data: Service!
	}
`;

module.exports = typeDefs;