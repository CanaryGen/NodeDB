const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

// Database functions
let readDatabase, writeDatabase;

switch (config.databaseStyle) {
    case 'nodedb':
        readDatabase = () => {
            const data = fs.readFileSync('db/database.txt', 'utf8');
            const lines = data.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#'));
            const db = {};
            lines.forEach(line => {
                const [key, ...values] = line.split(' ');
                db[key] = values;
            });
            return db;
        };

        writeDatabase = (db) => {
            const data = Object.entries(db).map(([key, values]) => `${key} ${values.join(' ')}`).join('\n');
            fs.writeFileSync('db/database.txt', data, 'utf8');
        };
        break;

    case 'json':
        readDatabase = () => {
            const data = fs.readFileSync('db/database.json', 'utf8');
            return JSON.parse(data);
        };

        writeDatabase = (db) => {
            const data = JSON.stringify(db, null, 2);
            fs.writeFileSync('db/database.json', data, 'utf8');
        };
        break;

    case 'yml':
        readDatabase = () => {
            const data = fs.readFileSync('db/database.yml', 'utf8');
            return yaml.load(data);
        };

        writeDatabase = (db) => {
            const data = yaml.dump(db);
            fs.writeFileSync('db/database.yml', data, 'utf8');
        };
        break;

    case 'sec_nodedb':
        const algorithm = 'aes-256-cbc';
        const encryptionKey = config.encryptionKey;
        const iv = crypto.randomBytes(16);

        const encrypt = (text) => {
            let cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
        };

        const decrypt = (text) => {
            let iv = Buffer.from(text.iv, 'hex');
            let encryptedText = Buffer.from(text.encryptedData, 'hex');
            let decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        };

        readDatabase = () => {
            const data = fs.readFileSync('db/sec_database.txt', 'utf8');
            const decryptedData = decrypt(JSON.parse(data));
            const lines = decryptedData.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#'));
            const db = {};
            lines.forEach(line => {
                const [key, ...values] = line.split(' ');
                db[key] = values;
            });
            return db;
        };

        writeDatabase = (db) => {
            const data = Object.entries(db).map(([key, values]) => `${key} ${values.join(' ')}`).join('\n');
            const encryptedData = encrypt(data);
            fs.writeFileSync('db/sec_database.txt', JSON.stringify(encryptedData), 'utf8');
        };
        break;

    default:
        throw new Error(`Unknown database style: ${config.databaseStyle}`);
}

// JWT authentication
if (config.JWT.useJWT) {
    app.post('/login', (req, res) => {
        const { username, password } = req.body;
        if (authenticate(username, password)) {
            const token = jwt.sign({ username }, config.JWT.secret, { expiresIn: '1h' });
            res.json({ success: true, token });
        } else {
            logger.error('Invalid credentials');
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });

    const verifyToken = (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) {
            logger.error('No token provided');
            return res.status(403).json({ message: 'No token provided' });
        }

        jwt.verify(token, config.JWT.secret, (err, decoded) => {
            if (err) {
                logger.error('Failed to authenticate token');
                return res.status(401).json({ message: 'Failed to authenticate token' });
            }
            req.username = decoded.username;
            next();
        });
    };

    // Use verifyToken in your routes
    app.get('/data/:key', verifyToken, (req, res) => {
        const { key } = req.params;
        const db = readDatabase();
        if (db[key]) {
            res.json({ key, values: db[key] });
        } else {
            logger.error(`Key ${key} not found`);
            res.status(404).json({ message: 'Key not found' });
        }
    });

    app.get('/data/:key/:value', verifyToken, (req, res) => {
        const { key, value } = req.params;
        const db = readDatabase();
        if (db[key] && db[key].includes(value)) {
            res.json({ key, value });
        } else {
            logger.error(`Key ${key} or value ${value} not found`);
            res.status(404).json({ message: 'Key or value not found' });
        }
    });

    app.post('/data', verifyToken, (req, res) => {
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

    app.put('/data/:key', verifyToken, (req, res) => {
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

    app.delete('/data/:key', verifyToken, (req, res) => {
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
} else {
    // Use your current authentication method
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
}

// Rate limiting
const rateLimitConfig = config.rateLimit;

const limiter = rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.max,
    message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Validation schema
const dataSchema = Joi.object({
    key: Joi.string().required(),
    values: Joi.array().items(Joi.string()).required()
});

app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(config.port, config.ip, () => {
    logger.info(`Server is running on ${config.ip}:${config.port}`);
});
