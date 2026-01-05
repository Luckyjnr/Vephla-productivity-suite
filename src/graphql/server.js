const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const { createContext } = require('./context');

/**
 * Create and configure Apollo GraphQL Server
 */
const createGraphQLServer = () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    
    // Enable introspection in development
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

    // Configure for development
    ...(process.env.NODE_ENV === 'development' && {
      plugins: [
        {
          requestDidStart() {
            return {
              willSendResponse(requestContext) {
                // Add CORS headers for development
                const { response } = requestContext;
                if (response.http) {
                  response.http.headers.set('Access-Control-Allow-Origin', '*');
                  response.http.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                  response.http.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                }
              }
            };
          }
        }
      ]
    })
  });

  return server;
};

module.exports = { createGraphQLServer };

module.exports = { createGraphQLServer };