const express = require('express');
const taskRouter = express.Router();
const Task = require('../../src/model/task');
const auth = require('../middleware/auth');

taskRouter.post('/', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(201).send(task);
    } catch (err) {
        res.status(400).send(err);
    }
});

//populate tasks virtual field of user object
//-1 descending, 1 ascending
taskRouter.get('/', auth, async (req, res) => {
    const match = {};
    if (req.query.completed) {
        match.completed = (req.query.completed) === 'true';
    }
    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1;
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match: match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (err) {
        res.status(500).send(err);
    }
})

taskRouter.get('/:taskId', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (err) {
        return res.status(500).send(err);
    }
})

taskRouter.patch('/:taskId', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every(update => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        res.status(400).send({ error: "Invalid updates" });
    }

    try {
        const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach(update => {
            task[update] = req.body[update];
        })

        await task.save();

        res.send(task);
    } catch (err) {
        return res.status(500).send(err);
    }
})

taskRouter.delete('/:taskId', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.taskId, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.status(204).send();
    } catch (err) {
        return res.status(500).send(err);
    }
})

module.exports = taskRouter;