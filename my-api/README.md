# My API

This project is a FastAPI application that manages users and gyms. It provides a RESTful API for creating, retrieving, updating, and deleting users and gyms.

## Project Structure

```
my-api
├── src
│   ├── controllers
│   │   ├── usersController.ts
│   │   └── gymsController.ts
│   ├── models
│   │   ├── userModel.ts
│   │   └── gymModel.ts
│   ├── routes
│   │   ├── usersRoutes.ts
│   │   └── gymsRoutes.ts
│   ├── services
│   │   ├── userService.ts
│   │   └── gymService.ts
│   └── app.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/my-api.git
   ```

2. Navigate to the project directory:
   ```
   cd my-api
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run the following command:
```
npm start
```

The API will be available at `http://localhost:8000`.

## API Endpoints

### Users

- **POST /users**: Create a new user
- **GET /users/{id}**: Retrieve a user by ID
- **PUT /users/{id}**: Update a user by ID
- **DELETE /users/{id}**: Delete a user by ID

### Gyms

- **POST /gyms**: Create a new gym
- **GET /gyms/{id}**: Retrieve a gym by ID
- **PUT /gyms/{id}**: Update a gym by ID
- **DELETE /gyms/{id}**: Delete a gym by ID

## Contributing

Feel free to submit issues or pull requests to improve the project.