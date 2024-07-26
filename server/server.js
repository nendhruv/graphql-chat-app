const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const bodyParser = require('body-parser');
const { PubSub } = require('graphql-subscriptions');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const pubsub = new PubSub();

const typeDefs = gql`
  type Message {
    id: ID!
    user: String!
    content: String!
    isImage: Boolean!
  }

  type Query {
    messages: [Message!]!
  }

  type Mutation {
    sendMessage(user: String!, content: String!, isImage: Boolean!): Message!
  }

  type Subscription {
    messageSent: Message!
  }
`;

const messages = [];
let nextId = 1;

const resolvers = {
  Query: {
    messages: () => messages,
  },
  Mutation: {
    sendMessage: (_, { user, content, isImage }) => {
      const message = { id: nextId++, user, content, isImage };
      messages.push(message);
      pubsub.publish('MESSAGE_SENT', { messageSent: message });
      return message;
    },
  },
  Subscription: {
    messageSent: {
      subscribe: () => pubsub.asyncIterator(['MESSAGE_SENT']),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({ schema });

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const httpServer = createServer(app);

  SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: server.graphqlPath }
  );

  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();