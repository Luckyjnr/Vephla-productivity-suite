const request = require('supertest');
const { connectDB, disconnectDB } = require('./setup');

// Import app after setup to ensure proper initialization
let app;

describe('GraphQL API', () => {
  beforeAll(async () => {
    await connectDB();
    // Import app after database connection
    app = require('../src/app');
    // Give the GraphQL server time to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('GraphQL Endpoint', () => {
    test('should respond to basic GraphQL query', async () => {
      const basicQuery = {
        query: `
          query {
            __typename
          }
        `
      };

      const response = await request(app)
        .post('/graphql')
        .send(basicQuery)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.__typename).toBe('Query');
    });
  });
});