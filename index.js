require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { authenticateToken, SECRET } = require('./auth');
const app = express();

app.use(express.json());

//REGISTER
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
     return res.status(400).json({ error: 'Username and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  }catch (err) {
    res.status(400).json({ error: 'Username already taken'});
  }
});

//LOGIN
app.post('/auth/login', async(req,res) => {
  const { username, password } = req.body;

  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Get all tasks - only the logged-in user's own tasks
app.get('/tasks', authenticateToken, async (req, res ) => {
  const result = await pool.query('SELECT * FROM tasks WHERE user_id =$1 ORDER BY id', [req.user.id]);
  res.json(result.rows);
});

// Get One task
// app.get('/tasks/:id', async (req, res) => {
//   const id = Number(req.params.id);
//   const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

//   if (result.rows.length === 0) {
//     return res.status(404).json({ error: 'Task not found' });
//   }

//   res.json(result.rows[0]);
// });

// POST - Create a new task - PROTECTED - tied to the logged-in user
app.post('/tasks', authenticateToken,async (req,res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = await pool.query('INSERT INTO tasks (title, user_id) VALUES ($1, $2) RETURNING *', [title, req.user.id]);
  res.status(201).json(result.rows[0]);
});

// PUT - Update a task - PROTECTED- only if it belongs to the logged-in user
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;

  const result = await pool.query('UPDATE tasks SET title = COALESCE($1, title), done = COALESCE($2, done) WHERE id = $3 AND user_id = $4 RETURNING *', [title, done, id, req.user.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(result.rows[0]);
});

//DELETE - Delete a task - PROTECTED - only if it belongs to this user
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(204).send();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});