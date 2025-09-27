# Hackthon Backend Server

A robust backend server built with Node.js, TypeScript, Express, MongoDB, and Swagger documentation.

## Features

- 🚀 **Node.js & TypeScript** - Modern JavaScript with type safety
- 🛡️ **Express.js** - Fast, unopinionated web framework
- 🍃 **MongoDB** - NoSQL database with Mongoose ODM
- 📚 **Swagger** - Interactive API documentation
- 🔒 **Security** - Helmet, CORS, rate limiting
- 🏗️ **Architecture** - Clean, scalable project structure
- 🧪 **Development** - Hot reload with nodemon
- 📝 **Linting** - ESLint for code quality

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/hackthon_db
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   - Local: Make sure MongoDB is running on your system
   - Cloud: Update `MONGODB_URI` in `.env` with your cloud connection string

## Development

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Other Scripts

```bash
npm run lint          # Check code quality
npm run lint:fix      # Fix linting issues
npm test             # Run tests
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **API Root**: http://localhost:3000/

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Example User Object

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "age": 25
}
```

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # MongoDB connection
│   └── swagger.ts   # Swagger configuration
├── controllers/     # Route controllers
│   └── userController.ts
├── middleware/      # Custom middleware
│   ├── asyncHandler.ts
│   ├── errorHandler.ts
│   └── notFound.ts
├── models/          # Mongoose models
│   └── User.ts
├── routes/          # Express routes
│   └── userRoutes.ts
└── server.ts        # Main server file
```

## Security Features

- **Helmet** - Sets various HTTP headers for security
- **CORS** - Cross-Origin Resource Sharing configuration
- **Rate Limiting** - Prevents abuse with request limiting
- **Input Validation** - Mongoose schema validation
- **Error Handling** - Centralized error handling

## Environment Variables

| Variable      | Description               | Default                               |
| ------------- | ------------------------- | ------------------------------------- |
| `PORT`        | Server port               | 3000                                  |
| `NODE_ENV`    | Environment               | development                           |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/hackthon_db |
| `CORS_ORIGIN` | Allowed CORS origin       | http://localhost:3000                 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
