const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.DB_CONNECT_STRING);
// mongodb://localhost:27017/leetcode

    //  await mongoose.connect("mongodb://localhost:27017/leetcode")
}

module.exports = main;


