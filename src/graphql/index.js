const { createGraphQLServer } = require('./server');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const { createContext } = require('./context');
const directives = require('./directives');

module.exports = {
  createGraphQLServer,
  typeDefs,
  resolvers,
  createContext,
  directives
};