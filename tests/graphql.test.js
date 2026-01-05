const request = require('supertest');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const jwt = require('jsonwebtoken');

// Import app directly
const app = require('../src/app');

describe('GraphQL API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Give the app time to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create a test user for authenticated requests
    testUser = new User({
      email: 'graphql-test@example.com',
      name: 'GraphQL Test User',
      passwordHash: 'hashedpassword',
      role: 'standard'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await Task.deleteMany({ userId: testUser._id });
      await User.findByIdAndDelete(testUser._id);
    }
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

    test('should create task with correct enum values', async () => {
      const createTaskMutation = {
        query: `
          mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) {
              id
              title
              status
              priority
              owner {
                email
              }
            }
          }
        `,
        variables: {
          input: {
            title: 'Test Task with Enums',
            description: 'Testing enum values',
            priority: 'medium'
          }
        }
      };

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTaskMutation)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.data.createTask).toBeDefined();
      expect(response.body.data.createTask.title).toBe('Test Task with Enums');
      expect(response.body.data.createTask.status).toBe('pending');
      expect(response.body.data.createTask.priority).toBe('medium');
      expect(response.body.data.createTask.owner.email).toBe('graphql-test@example.com');
    });

    test('should update task status with correct enum values', async () => {
      // First create a task
      const createTaskMutation = {
        query: `
          mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            title: 'Task to Update',
            priority: 'high'
          }
        }
      };

      const createResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTaskMutation)
        .expect(200);

      const taskId = createResponse.body.data.createTask.id;

      // Now update the task status
      const updateTaskMutation = {
        query: `
          mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
            updateTask(id: $id, input: $input) {
              id
              status
              priority
            }
          }
        `,
        variables: {
          id: taskId,
          input: {
            status: 'in_progress',
            priority: 'low'
          }
        }
      };

      const updateResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateTaskMutation)
        .expect(200);

      expect(updateResponse.body.errors).toBeUndefined();
      expect(updateResponse.body.data.updateTask.status).toBe('in_progress');
      expect(updateResponse.body.data.updateTask.priority).toBe('low');
    });
  });
});