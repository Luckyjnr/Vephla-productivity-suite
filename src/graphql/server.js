const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const { createContext } = require('./context');
const { requireAuthDirective, requireRoleDirective } = require('./directives');

/**
 * Create and configure Apollo GraphQL Server
 */
const createGraphQLServer = () => {
  // Create executable schema with directives
  let schema = makeExecutableSchema({
    typeDefs: [
      typeDefs,
      requireAuthDirective().requireAuthDirectiveTypeDefs,
      requireRoleDirective().requireRoleDirectiveTypeDefs
    ],
    resolvers
  });

  // Apply directive transformers
  schema = requireAuthDirective().requireAuthDirectiveTransformer(schema);
  schema = requireRoleDirective().requireRoleDirectiveTransformer(schema);

  const server = new ApolloServer({
    schema,
    context: createContext,
    
    // Enable GraphQL Playground in development
    introspection: process.env.NODE_ENV !== 'production',
    
    // Error formatting
    formatError: (error) => {
      // Log the error for debugging
      console.error('GraphQL Error:', error);
      
      // Return formatted error to client
      return {
        message: error.message,
        code: error.extensions?.code,
        path: error.path,
        locations: error.locations
      };
    },
    
    // Custom validation rules can be added here
    validationRules: [],
    
    // Upload configuration (if needed for file uploads via GraphQL)
    uploads: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }
  });

  return server;
};

module.exports = { createGraphQLServer };