const express = require('express');
const dotenv = require('dotenv');
const { GraphQLServer, PubSub } = require("graphql-yoga");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

dotenv.config({
	path: ".env",
});

const MongoDb_uri = process.env.MONGO_URL;

const pubsub = new PubSub();

const options = {
	port: process.env.PORT
};
const app = express();

app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Method', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Header', 'Accept, Content-Type, Authorization');
	res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization");
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
})

const server = new GraphQLServer({
	typeDefs,
	resolvers,
	context: {
		pubsub
	},
	formatError(err) {
		if (!err.originalError) {
			return err;
		}
		const data = err.originalError.data;
		const message = err.message || 'An error occurred.';
		const code = err.originalError.code || 500;
		return { message: message, status: code, data: data };
	}
});
app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message: message });
});


mongoose.connect(MongoDb_uri, {
	useUnifiedTopology: true,
	useNewUrlParser: true, 
	useCreateIndex: true,
	useFindAndModify: false
})
.then(() => console.log('Client Connected on MongoDB'))
.catch(err => console.log(err))

server.start(options, ({ port }) => {
	console.log(
		`Graphql Server started, listening on port ${port} for incoming requests.`
	);
});
