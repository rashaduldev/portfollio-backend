import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Portfolio Backend API",
      version: "1.0.0",
      description: "API documentation for my portfolio backend",
    },
    servers: [
      {
        url: "http://localhost:5000", // তোমার local server URL
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // এখানে তোমার route ফাইলের path
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
