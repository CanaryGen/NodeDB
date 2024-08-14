const fs = require('fs');
const yaml = require('js-yaml');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter password to hash: ', (password) => {
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            console.error('Error hashing password:', err);
            rl.close();
            return;
        }

        const dbConfig = {
            users: [
                {
                    username: 'admin',
                    password: hash
                }
            ]
        };

        fs.writeFileSync('db.yml', yaml.dump(dbConfig));
        console.log('Password hashed and written to db.yml');
        rl.close();
    });
});

rl.on('close', () => {
    process.exit(0);
});
