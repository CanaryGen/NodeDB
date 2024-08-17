const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const Joi = require('joi');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const config = yaml.load(fs.readFileSync('config.yml', 'utf8'));
const dbConfig = yaml.load(fs.readFileSync('db.yml', 'utf8'));

// Logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Password hashing
const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

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
        logger.error('Authorization header missing');
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    if (authenticate(username, password)) {
        next();
    } else {
        logger.error('Invalid credentials');
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Validation schema
const dataSchema = Joi.object({
    key: Joi.string().required(),
    values: Joi.array().items(Joi.string()).required()
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (authenticate(username, password)) {
        res.json({ success: true });
    } else {
        logger.error('Invalid credentials');
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/data/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    const db = readDatabase();
    if (db[key]) {
        res.json({ key, values: db[key] });
    } else {
        logger.error(`Key ${key} not found`);
        res.status(404).json({ message: 'Key not found' });
    }
});

app.get('/data/:key/:value', requireAuth, (req, res) => {
    const { key, value } = req.params;
    const db = readDatabase();
    if (db[key] && db[key].includes(value)) {
        res.json({ key, value });
    } else {
        logger.error(`Key ${key} or value ${value} not found`);
        res.status(404).json({ message: 'Key or value not found' });
    }
});

app.post('/data', requireAuth, (req, res) => {
    const { error, value } = dataSchema.validate(req.body);
    if (error) {
        logger.error(`Validation error: ${error.details[0].message}`);
        return res.status(400).json({ message: error.details[0].message });
    }

    const { key, values } = value;
    const db = readDatabase();
    if (db[key]) {
        logger.error(`Key ${key} already exists`);
        res.status(400).json({ message: 'Key already exists' });
    } else {
        db[key] = values;
        writeDatabase(db);
        res.json({ success: true, key, values });
    }
});

app.put('/data/:key', requireAuth, (req, res) => {
    const { error, value } = dataSchema.validate(req.body);
    if (error) {
        logger.error(`Validation error: ${error.details[0].message}`);
        return res.status(400).json({ message: error.details[0].message });
    }

    const { key } = req.params;
    const { values } = value;
    const db = readDatabase();
    if (db[key]) {
        db[key] = values;
        writeDatabase(db);
        res.json({ success: true, key, values });
    } else {
        logger.error(`Key ${key} not found`);
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
        logger.error(`Key ${key} not found`);
        res.status(404).json({ message: 'Key not found' });
    }
});

app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(config.port, config.ip, () => {
    logger.info(`Server is running on ${config.ip}:${config.port}`);
});
