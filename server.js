const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const config = yaml.load(fs.readFileSync('config.yml', 'utf8'));
const dbConfig = yaml.load(fs.readFileSync('db.yml', 'utf8'));

const dbPath = './db/database.json';

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
  const { username, password } = req.headers;
  const user = dbConfig.users[username];
  if (user && user.password === password) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

app.use(authenticate);

// Read the database
const readDatabase = () => {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

// Write to the database
const writeDatabase = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// GET all data
app.get('/data', (req, res) => {
  const data = readDatabase();
  res.json(data);
});

// POST new data
app.post('/data', (req, res) => {
  const data = readDatabase();
  const newData = req.body;
  const updatedData = { ...data, ...newData };
  writeDatabase(updatedData);
  res.status(201).send('Data added');
});

// PUT update data
app.put('/data/:key', (req, res) => {
  const data = readDatabase();
  const { key } = req.params;
  const newData = req.body;
  if (data[key]) {
    data[key] = newData;
    writeDatabase(data);
    res.status(200).send('Data updated');
  } else {
    res.status(404).send('Key not found');
  }
});

// DELETE data
app.delete('/data/:key', (req, res) => {
  const data = readDatabase();
  const { key } = req.params;
  if (data[key]) {
    delete data[key];
    writeDatabase(data);
    res.status(200).send('Data deleted');
  } else {
    res.status(404).send('Key not found');
  }
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});