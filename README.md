# NodeDB - Local File-Based Database

NodeDB is a simple local file-based database system implemented in Node.js. It allows you to store, retrieve, update, and delete data using a text file as the backend storage. The system includes basic authentication to secure all data operations.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Authentication](#authentication)
  - [API Endpoints](#api-endpoints)
- [Database Structure](#database-structure)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Features

- **Authentication**: Secure your data with basic HTTP authentication for all operations.
- **CRUD Operations**: Perform Create, Read, Update, and Delete operations on your data.
- **File-Based Storage**: Data is stored in a plain text file for simplicity.

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
   npm install express js-yaml body-parser bcrypt
   ```

## Configuration

### config.yml

This file contains server configuration settings such as the port number.

Example:
```yaml
port: 3000
ip: 0.0.0.0
```

### db.yml

This file contains user authentication data. Each user has a username and a hashed password.

Example:
```yaml
users:
  - username: admin
    password: $2b$10$GZk7n/b5QqKJZ9Z5z5z5zO
```

### db/database.txt

This file stores the actual data in a simple key-value format. Each line represents a key and its associated values.

Example:
```
key1 value1 value2
key2 value1 value2 value3
key3 value1
```

## Usage

### Starting the Server

To start the server, run the following command:
```sh
node server.js
```

### Authentication

To authenticate, include the `Authorization` header with your requests. The header value should be in the format `Basic <base64-encoded-credentials>`.

Example:
```sh
curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"key\": \"key4\", \"values\": [\"value1\", \"value2\", \"value3\"]}"
```

### API Endpoints

- **POST /login**: Authenticate with the server.
  ```sh
  curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d "{\"username\": \"admin\", \"password\": \"adminpassword\"}"
  ```

- **GET /data/:key**: Retrieve values for a specific key.
  ```sh
  curl http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
  ```

- **GET /data/:key/:value**: Check if a specific value exists for a key.
  ```sh
  curl http://localhost:3000/data/key1/value1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
  ```

- **POST /data**: Add a new key and values.
  ```sh
  curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"key\": \"key4\", \"values\": [\"value1\", \"value2\", \"value3\"]}"
  ```

- **PUT /data/:key**: Update values for an existing key.
  ```sh
  curl -X PUT http://localhost:3000/data/key1 -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"values\": [\"newValue1\", \"newValue2\"]}"
  ```

- **DELETE /data/:key**: Delete a key and its values.
  ```sh
  curl -X DELETE http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
  ```

## Database Structure

The database is stored in a plain text file named `database.txt` located in the `db` directory. Each line in the file represents a key and its associated values, separated by spaces.

Example:
```
key1 value1 value2
key2 value1 value2 value3
key3 value1
```

### Key-Value Format

- **Key**: The identifier for the data.
- **Values**: The data associated with the key, separated by spaces.

## Examples

### Adding a New Key and Values

```sh
curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"key\": \"key4\", \"values\": [\"value1\", \"value2\", \"value3\"]}"
```

### Retrieving Values for a Key

```sh
curl http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
```

### Updating Values for a Key

```sh
curl -X PUT http://localhost:3000/data/key1 -H "Content-Type: application/json" -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA==" -d "{\"values\": [\"newValue1\", \"newValue2\"]}"
```

### Deleting a Key

```sh
curl -X DELETE http://localhost:3000/data/key1 -H "Authorization: Basic YWRtaW46YWRtaW5wYXNzd29yZA=="
```

## Troubleshooting

If you encounter any issues, please check the following:

- Ensure that the server is running.
- Verify that the `Authorization` header is correctly formatted.
- Check the configuration files for any misconfigurations.

If the problem persists, feel free to open an issue on the GitHub repository.
