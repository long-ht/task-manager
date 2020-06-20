//express,multer,sharp,bcrypt,jsonwebtoken

const express = require('express');
const bodyParser = require('body-parser');
require('./db/mongoose');
const userRouter = require('../api/userRouter/userRouter');
const taskRouter = require('../api/taskRouter/taskRouter');

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

app.use('/users', userRouter);
app.use('/tasks', taskRouter);

app.listen(PORT, () => {
    console.log('listening on ' + PORT);
});
