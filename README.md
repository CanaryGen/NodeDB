# NodeDB - Local File-Based Database

NodeDB is a simple local file-based database system implemented in Node.js. It allows you to store, retrieve, update, and delete data using various file formats (text, JSON, YAML) as the backend storage. The system includes advanced authentication using JWT and supports multiple database styles, including an encrypted variant.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Authentication](#authentication)
  - [API Endpoints](#api-endpoints)
    - [With JWT Authentication](#with-jwt-authentication)
    - [Without JWT Authentication](#without-jwt-authentication)
- [Database Styles](#database-styles)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Features

- **JWT Authentication**: Secure your data with JSON Web Token (JWT) authentication for all operations.
- **Multiple Database Styles**: Supports text, JSON, YAML, and encrypted database formats.
- **CRUD Operations**: Perform Create, Read, Update, and Delete operations on your data.
- **Rate Limiting**: Limits the number of requests from an IP to prevent abuse.
- **CORS Support**: Allows cross-origin requests for easier integration with front-end applications.
- **Input Validation**: Ensures that the data being sent to the server is in the correct format.
- **Customizable Configuration**: Easily configure the server, authentication, and database settings.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: (v14.x or higher)
- **npm**: (v6.x or higher)

## Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/CanaryGen/NodeDB.git
   cd NodeDB
   ```

2. **Install dependencies**:
   ```sh
   npm install express js-yaml body-parser bcrypt winston express-rate-limit cors joi jsonwebtoken crypto
   ```

## Configuration

### config.yml

This file contains server configuration settings such as the port number, JWT settings, and rate limiting.

Example:
```yaml
port: 3000
ip: 0.0.0.0
JWT:
  useJWT: true
  secret: "your_secret_key"
databaseStyle: "nodedb" # Possible values: nodedb, json, yml, sec_nodedb
encryptionKey: "your_encryption_key" # Only required if databaseStyle is sec_nodedb
rateLimit:
  windowMs: 15 * 60 * 1000 # 15 minutes
  max: 100 # Limit each IP to 100 requests per windowMs
```

### db.yml

This file contains user authentication data. Each user has a username and a hashed password.

Example:
```yaml
users:
  - username: admin
    password: $2b$10$GZk7n/b5QqKJZ9Z5z5z5zO
```

### Database Files

Depending on the `databaseStyle` setting in `config.yml`, the data will be stored in different formats:

- **nodedb**: `db/database.txt`
- **json**: `db/database.json`
- **yml**: `db/database.yml`
- **sec_nodedb**: `db/sec_database.txt` (encrypted)

## Usage

### Starting the Server

To start the server, run the following command:
```sh
node server.js
```

### Authentication

To authenticate, include the `Authorization` header with your requests. The header value should be in the format `Bearer <JWT-token>` if JWT is enabled, or `Basic <base64-encoded-credentials>` if JWT is disabled.

### API Endpoints

#### With JWT Authentication

- **POST /login**: Authenticate with the server and get a JWT token.
  ```sh
  curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d "{\"username\": \"admin\", \"password\": \"adminpassword\"}"
  ```

- **GET /data/:key**: Retrieve values for a specific key.
  ```sh
  curl http://localhost:3000/data/key1 -H "Authorization: Bearer <JWT-token>"
  ```

- **GET /data/:key/:value**: Check if a specific value exists for a key.
  ```sh
  curl http://localhost:3000/data/key1/value1 -H "Authorization: Bearer <JWT-token>"
  ```

- **POST /data**: Add a new key and values.
  ```sh
  curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "Authorization: Bearer <JWT-token>" -d "{\"key\": \"key4\", \"values\": [\"value1\", \"value2\", \"value3\"]}"
  ```

- **PUT /data/:key**: Update values for an existing key.
  ```sh
  curl -X PUT http://localhost:3000/data/key1 -H "Content-Type: application/json" -H "Authorization: Bearer <JWT-token>" -d "{\"values\": [\"newValue1\", \"newValue2\"]}"
  ```

- **DELETE /data/:key**: Delete a key and its values.
  ```sh
  curl -X DELETE http://localhost:3000/data/key1 -H "Authorization: Bearer <JWT-token>"
  ```

#### Without JWT Authentication

- **POST /data**: Add a new key and values.
  ```sh
  curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"key\": \"key4\", \"values\": [\"value1\", \"value2\", \"value3\"]}"
  ```

- **GET /data/:key**: Retrieve values for a specific key.
  ```sh
  curl http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
  ```

- **GET /data/:key/:value**: Check if a specific value exists for a key.
  ```sh
  curl http://localhost:3000/data/key1/value1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
  ```

- **PUT /data/:key**: Update values for an existing key.
  ```sh
  curl -X PUT http://localhost:3000/data/key1 -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"values\": [\"newValue1\", \"newValue2\"]}"
  ```

- **DELETE /data/:key**: Delete a key and its values.
  ```sh
  curl -X DELETE http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
  ```

## Database Styles

- **nodedb**: Plain text file with key-value pairs.
- **json**: JSON file with key-value pairs.
- **yml**: YAML file with key-value pairs.
- **sec_nodedb**: Encrypted plain text file with key-value pairs.

## Examples

### Adding a New Key and Values

#### With JWT Authentication

```sh
curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "Authorization: Bearer <JWT-token>" -d "{\"key\": \"key4\", \"values\": [\"value1\", \"value2\", \"value3\"]}"
```

#### Without JWT Authentication

```sh
curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"key\": \"key4\", \"values\": [\"value1\", \"value2\", \"value3\"]}"
```

### Retrieving Values for a Key

#### With JWT Authentication

```sh
curl http://localhost:3000/data/key1 -H "Authorization: Bearer <JWT-token>"
```

#### Without JWT Authentication

```sh
curl http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
```

### Updating Values for a Key

#### With JWT Authentication

```sh
curl -X PUT http://localhost:3000/data/key1 -H "Content-Type: application/json" -H "Authorization: Bearer <JWT-token>" -d "{\"values\": [\"newValue1\", \"newValue2\"]}"
```

#### Without JWT Authentication

```sh
curl -X PUT http://localhost:3000/data/key1 -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"values\": [\"newValue1\", \"newValue2\"]}"
```

### Deleting a Key

#### With JWT Authentication

```sh
curl -X DELETE http://localhost:3000/data/key1 -H "Authorization: Bearer <JWT-token>"
```

#### Without JWT Authentication

```sh
curl -X DELETE http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
```

## Troubleshooting

If you encounter any issues, please check the following:

- Ensure that the server is running.
- Verify that the `Authorization` header is correctly formatted.
- Check the configuration files for any misconfigurations.

If the problem persists, feel free to open an issue on the GitHub repository.
