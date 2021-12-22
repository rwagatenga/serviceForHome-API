const http = require('http');
const { GraphQLServer, PubSub } = require("graphql-yoga");
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
//const multer = require('multer');
const graphqlHttp = require('express-graphql');
const pubsub = new PubSub();

// const graphqlSchema = require('./graphql/schema');
const typeDefs = require("./graphql/typeDefs");
const graphqlResolver = require('./graphql/resolvers');

const MongoDb_uri = "mongodb+srv://node:hOdvywNk7xZg8uCK@nodejs.cs7gj.mongodb.net/services?retryWrites=true&w=majority";
// const MongoDb_uri = "mongodb+srv://node:hOdvywNk7xZg8uCK@nodejs-cs7gj.mongodb.net/services";

const options = {
	port: 8080
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

// app.use('/graphql', graphqlHttp({
// 	schema: graphqlSchema,
// 	rootValue: graphqlResolver,
// 	graphiql: true,
// 	formatError(err) {
//       if (!err.originalError) {
//         return err;
//       }
//       const data = err.originalError.data;
//       const message = err.message || 'An error occurred.';
//       const code = err.originalError.code || 500;
//       return { message: message, status: code, data: data };
//     }
// }));
const server = new GraphQLServer({
	schema: typeDefs,
	graphqlResolver,
	context: {
		pubsub
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
.then(() => console.log('connected'))
.catch(err => console.log(err))
server.start(options, ({ port }) => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});


// mongoose.connect(MongoDb_uri, {
// 	useUnifiedTopology: true, 
// 	useNewUrlParser: true, 
// 	useCreateIndex: true,
// 	useFindAndModify: false
// })
// .then(result => {
// 	// app.listen(PORT);
// 	console.log('Client connected');
// 	 //    const io = require('./server').init(server);
//  //    io.on('connection', socket => {
//     //   console.log('Client connected');
//     // });
// })
// .catch(err => {
// 	const error = new Error("Connection Failed!");
//     throw error;
// });

// server.start(options, ({ port }) => {
// 	console.log(
// 		`Graphql Server started, listening on port ${port} for incoming requests.`
// 	);
// });