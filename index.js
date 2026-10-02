const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// ===============================
// SCHEMAS AND MODELS
// ===============================

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  exercises: [exerciseSchema]
});

const User = mongoose.model('User', userSchema);

// ===============================
// HOME PAGE
// ===============================

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ===============================
// POST /api/users
// Create a new user
// ===============================

app.post('/api/users', async (req, res) => {
  try {
    const user = new User({
      username: req.body.username
    });

    const savedUser = await user.save();

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// GET /api/users
// Get all users
// ===============================

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, {
      username: 1
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// POST /api/users/:_id/exercises
// Add an exercise
// ===============================

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const exerciseDate = req.body.date
      ? new Date(req.body.date)
      : new Date();

    const exercise = {
      description: req.body.description,
      duration: Number(req.body.duration),
      date: exerciseDate
    };

    user.exercises.push(exercise);
    await user.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// GET /api/users/:_id/logs
// Get exercise log
// Supports from, to, and limit
// ===============================

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    let exercises = user.exercises;

    // Filter FROM date
    if (req.query.from) {
      const fromDate = new Date(req.query.from);

      exercises = exercises.filter(exercise => {
        return exercise.date >= fromDate;
      });
    }

    // Filter TO date
    if (req.query.to) {
      const toDate = new Date(req.query.to);

      exercises = exercises.filter(exercise => {
        return exercise.date <= toDate;
      });
    }

    // Limit results
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      exercises = exercises.slice(0, limit);
    }

    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// START SERVER
// ===============================

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Your app is listening on port ' +
    listener.address().port
  );
});