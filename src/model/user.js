const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('age must be positive');
            }
        }
    },
    email: {
        type: String,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email');
            }
        },
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (validator.contains(value, 'password', { ignoreCase: true })) {
                throw new Error('Password must not contains password');
            }
        }
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//toJSON always get called when express send back the user object in the response
userSchema.methods.toJSON = function () {
    const user = this.toObject();

    delete user.password;
    delete user.tokens;
    delete user.avatar;

    return user;
}

//create function for the User object
userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
    this.tokens = this.tokens.concat({ token });
    this.save();
    return token;
}

//create function for the User model
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new Error('Wrong email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Wrong email or password');
    }

    return user;
}

//hash the password
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

//delete tasks when user is removed
userSchema.pre('remove', async function (next) {
    await Task.deleteMany({ owner: this._id });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;