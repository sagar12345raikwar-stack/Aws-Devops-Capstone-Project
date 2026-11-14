const request = require('supertest');
const app = require('../../server');
const { createClient } = require('redis');

// Mock Redis with one shared client
jest.mock('redis', () => {
  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    info: jest.fn().mockResolvedValue('used_memory:1048576'),
    on: jest.fn().mockReturnThis(),
    del: jest.fn().mockResolvedValue(1)
  };

  return {
    createClient: jest.fn(() => mockRedisClient)
  };
});

describe('Enterprise DevOps Application - Unit Tests', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return welcome message with request ID', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('Enterprise DevOps');
      expect(res.body.requestId).toBeDefined();
      expect(res.body.features).toContain('Circuit Breaker Pattern');
    });
  });

  describe('GET /health', () => {
    it('should return comprehensive health status', async () => {
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.statusCode);
      expect(res.body.service).toEqual('enterprise-devops-app');
      expect(res.body.dependencies).toBeDefined();
    });
  });

  describe('GET /api/v1/products', () => {
    it('should return products with caching metadata', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cached).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should handle Redis errors gracefully', async () => {
  const redisClient = require('redis').createClient();

  redisClient.get.mockRejectedValueOnce(new Error('Redis error'));

  const res = await request(app).get('/api/v1/products');

  expect(res.statusCode).toEqual(500);
  expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/circuit-status', () => {
    it('should return circuit breaker status', async () => {
      const res = await request(app).get('/api/v1/circuit-status');
      expect(res.statusCode).toEqual(200);
      expect(['open', 'closed', 'OPEN', 'CLOSED']).toContain(res.body.circuitState);
      expect(res.body.stats).toBeDefined();
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple requests quickly
      const requests = Array(101).fill().map(() => 
        request(app).get('/')
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.statusCode === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Request ID middleware', () => {
    it('should generate request ID if not provided', async () => {
      const res = await request(app).get('/');
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('should use provided request ID', async () => {
      const customId = 'test-request-123';
      const res = await request(app)
        .get('/')
        .set('x-request-id', customId);
      expect(res.headers['x-request-id']).toEqual(customId);
      expect(res.body.requestId).toEqual(customId);
    });
  });

  describe('Error handling', () => {
    it('should handle simulated errors', async () => {
      const res = await request(app).get('/api/v1/error?type=server');
      expect(res.statusCode).toEqual(500);
    });

    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route');
      expect(res.statusCode).toEqual(404);
    });
  });
});
