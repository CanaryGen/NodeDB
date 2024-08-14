# NodeDB

NodeDB is a simple, local file-based database system built using Node.js. It leverages JSON files for data storage and YAML files for configuration and authentication, making it ideal for small-scale applications requiring a straightforward data storage solution.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Local File-Based Storage**: Uses JSON files for data storage.
- **User Authentication**: Secure access with user authentication via YAML configuration.
- **RESTful API Endpoints**: Easy data manipulation through RESTful API endpoints.
- **Lightweight and Simple**: Ideal for small-scale applications.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/NodeDB.git
   cd NodeDB
   ```

2. Install dependencies:
   ```bash
   npm install express js-yaml body-parser
   ```

3. Start the server:
   ```bash
   node server.js
   ```

## Configuration

### `config.yml`

Configure the port number for the server:

```yaml
port: 3000
```

### `db.yml`

Set up user credentials for authentication:

```yaml
users:
  admin:
    username: "admin"
    password: "admin_password"
```

## Usage

### Authentication

Include the username and password in the request headers for authentication:

```bash
curl -X GET http://localhost:3000/data -H "username: admin" -H "password: admin_password"
```

### API Endpoints

- **GET /data**: Retrieve all data.
- **POST /data**: Add new data.
- **PUT /data/:key**: Update data for a specific key.
- **DELETE /data/:key**: Delete data for a specific key.

### Examples

#### Adding Data

```bash
curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -H "username: admin" -H "password: admin_password" -d '{"key1": "value1"}'
```

#### Retrieving Data

```bash
curl -X GET http://localhost:3000/data -H "username: admin" -H "password: admin_password"
```

#### Updating Data

```bash
curl -X PUT http://localhost:3000/data/key1 -H "Content-Type: application/json" -H "username: admin" -H "password: admin_password" -d '{"key1": "new_value"}'
```

#### Deleting Data

```bash
curl -X DELETE http://localhost:3000/data/key1 -H "username: admin" -H "password: admin_password"
```
