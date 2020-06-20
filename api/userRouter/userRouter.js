const express = require('express');
const userRouter = express.Router();
const User = require('../../src/model/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../../src/email/account');

userRouter.post('/', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (err) {
        res.status(400).send(err);
    }
});

userRouter.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (err) {
        res.status(400).send(err.message);
    }
})

userRouter.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token != req.token;
        });
        await req.user.save();
        res.send();
    } catch (err) {
        res.status(500).send();
    }
})

userRouter.post('/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (err) {
        res.status(500).send();
    }
})


userRouter.get('/me', auth, async (req, res) => {
    res.send(req.user);
})

userRouter.patch('/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every(update => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        res.status(400).send({ error: "Invalid updates" });
    }

    try {
        const user = req.user;

        updates.forEach(update => {
            user[update] = req.body[update];
        })

        await user.save();
        res.send(user);
    } catch (err) {
        return res.status(500).send(err);
    }
})

userRouter.delete('/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.status(204).send();
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            return callback(new Error('Please upload an image'));
        }
        callback(undefined, true);
    }
});

//upload profile image using multer
userRouter.post('/me/upload', auth, upload.single('avatar'), async (req, res) => {
    //sharp resize image and convert to png
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;

    await req.user.save();
    res.send();
}, (err, req, res, next) => {
    res.send({ error: err.message });
})

//delete profile image
userRouter.delete('/me/upload', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(204).send();
})

userRouter.get('/:userId/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (err) {
        res.status(404).send()
    }
})

module.exports = userRouter;