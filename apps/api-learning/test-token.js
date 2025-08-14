const jwt = require("jsonwebtoken");

// Create a test JWT token
const payload = {
  id: "test-user-id",
  email: "test@example.com",
  role: "admin",
};

const secret = "your-jwt-secret-key"; // Same as in .env.example
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log("Test JWT Token:");
console.log(token);
console.log("\nUse this token in Authorization header as:");
console.log(`Bearer ${token}`);