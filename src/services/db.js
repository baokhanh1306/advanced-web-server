const chalk = require('chalk');
const mongoose = require('mongoose');

const db = (uri) => {
    mongoose
        .connect(uri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
        })
        .then(() =>
            console.log(
                chalk.cyan(
                    'Successfully established a connection to the database...'
                )
            )
        )
        .catch((err) =>
            console.log(
                chalk.red(
                    `Failed to connect to the database\n Error stack: ${err}`
                )
            )
        );
};

module.exports = db;
