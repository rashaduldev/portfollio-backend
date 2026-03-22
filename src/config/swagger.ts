import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio Backend API',
      version: '1.0.0',
      description: 'Production-ready portfolio backend API — TypeScript edition.',
      contact: { name: 'API Support', email: 'support@portfolio.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://api.portfolio.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
