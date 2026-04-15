const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// We override env before requiring server
process.env.NODE_ENV = 'test';

let app, server;
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri; // overriding process.env so db.js uses it

    // Reset mongoose models if they exist 
    mongoose.models = {};
    mongoose.connection.close(); // just in case
    
    const serverModule = require('../server');
    app = serverModule.app;
    server = serverModule.server;
    
    // waiting slightly for db connection to establish
    await new Promise(r => setTimeout(r, 500));
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
    server.close();
});

describe('Document API Endpoints', () => {
    let createdDocId;

    it('should create a new document', async () => {
        const res = await request(app)
            .post('/api/documents')
            .set('x-user', 'testuser')
            .send({ title: 'Test Doc', content: 'Hello World' });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.title).toEqual('Test Doc');
        expect(res.body.owner).toEqual('testuser');
        
        createdDocId = res.body._id;
    });

    it('should retrieve documents for a user', async () => {
        const res = await request(app)
            .get('/api/documents')
            .set('x-user', 'testuser');
            
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].title).toEqual('Test Doc');
    });

    it('should prevent access for unshared users', async () => {
        const res = await request(app)
            .get(`/api/documents/${createdDocId}`)
            .set('x-user', 'otheruser');
            
        expect(res.statusCode).toEqual(403);
    });

    it('should allow sharing with another user', async () => {
        const res = await request(app)
            .put(`/api/documents/${createdDocId}/share`)
            .set('x-user', 'testuser')
            .send({ username: 'otheruser' });
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.sharedWith).toContain('otheruser');
    });

    it('should now allow access for the shared user', async () => {
        const res = await request(app)
            .get(`/api/documents/${createdDocId}`)
            .set('x-user', 'otheruser');
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual('Test Doc');
    });
});
