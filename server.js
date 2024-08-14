const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());

const config = yaml.load(fs.readFileSync('config.yml', 'utf8'));
const dbConfig = yaml.load(fs.readFileSync('db.yml', 'utf8'));

const authenticate = (username, password) => {
    const user = dbConfig.users.find(u => u.username === username);
    if (user) {
        return bcrypt.compareSync(password, user.password);
    }
    return false;
};

const readDatabase = () => {
    const data = fs.readFileSync('db/database.txt', 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const db = {};
    lines.forEach(line => {
        const [key, ...values] = line.split(' ');
        db[key] = values;
    });
    return db;
};

const writeDatabase = (db) => {
    const data = Object.entries(db).map(([key, values]) => `${key} ${values.join(' ')}`).join('\n');
    fs.writeFileSync('db/database.txt', data, 'utf8');
};

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    if (authenticate(username, password)) {
        next();
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (authenticate(username, password)) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/data/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    const db = readDatabase();
    if (db[key]) {
        res.json({ key, values: db[key] });
    } else {
        res.status(404).json({ message: 'Key not found' });
    }
});

app.get('/data/:key/:value', requireAuth, (req, res) => {
    const { key, value } = req.params;
    const db = readDatabase();
    if (db[key] && db[key].includes(value)) {
        res.json({ key, value });
    } else {
        res.status(404).json({ message: 'Key or value not found' });
    }
});

app.post('/data', requireAuth, (req, res) => {
    const { key, values } = req.body;
    const db = readDatabase();
    if (db[key]) {
        res.status(400).json({ message: 'Key already exists' });
    } else {
        db[key] = values;
        writeDatabase(db);
        res.json({ success: true, key, values });
    }
});

app.put('/data/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    const { values } = req.body;
    const db = readDatabase();
    if (db[key]) {
        db[key] = values;
        writeDatabase(db);
        res.json({ success: true, key, values });
    } else {
        res.status(404).json({ message: 'Key not found' });
    }
});

app.delete('/data/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    const db = readDatabase();
    if (db[key]) {
        delete db[key];
        writeDatabase(db);
        res.json({ success: true, key });
    } else {
        res.status(404).json({ message: 'Key not found' });
    }
});

app.listen(config.port, config.ip, () => {
    console.log(`Server is running on ${config.ip}:${config.port}`);
});
