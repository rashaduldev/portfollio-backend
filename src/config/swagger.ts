import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Portfolio Backend API",
      version: "1.0.0",
      description:
        "Production-ready portfolio backend API — TypeScript edition.",
      contact: { name: "API Support", email: "support@portfolio.com" },
      license: { name: "MIT" },
    },
    servers: [
      {
        url: "https://rashaduldev-backend.vercel.app",
        description: "Production",
      },
      { url: "http://localhost:5000", description: "Development" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [
    "./src/routes/*.ts",
    "./src/routes/*.js",
    "./src/models/*.ts",
    "./src/models/*.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
