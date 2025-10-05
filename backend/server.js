const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const _ = require('lodash');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'replace_this_with_a_secure_secret';
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');   

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const defaultData = { users: [], assignments: [], submissions: [] };  
const db = new Low(adapter, defaultData);  // pass defaultData




(async function initDB(){
  await db.read();
  db.data = db.data || { users: [], assignments: [], submissions: [] };

  // Seed users if not exists
  if (!db.data.users.length) {
    const salt = bcrypt.genSaltSync(10);
    const teacherPass = bcrypt.hashSync('teacher123', salt);
    const studentPass = bcrypt.hashSync('student123', salt);
    db.data.users.push(
      { id: nanoid(), name: 'Teacher One', email: 'teacher@example.com', password: teacherPass, role: 'teacher' },
      { id: nanoid(), name: 'Student One', email: 'student@example.com', password: studentPass, role: 'student' }
    );
    await db.write();
    console.log('Seeded users: teacher@example.com / teacher123 and student@example.com / student123');
  }
})();

// Auth
app.post('/api/auth/login', async (req, res) => {
  await db.read();
  const { email, password } = req.body;
  const user = db.data.users.find(u => u.email === email);
  if(!user) return res.status(401).json({ message: 'Invalid credentials' });
  const valid = bcrypt.compareSync(password, user.password);
  if(!valid) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role, name: user.name, email: user.email });
});

// Middleware
function auth(requiredRole){
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader) return res.status(401).json({ message: 'Missing token' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;
      if(requiredRole && decoded.role !== requiredRole) return res.status(403).json({ message: 'Forbidden' });
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
}

// Create assignment (teacher)
app.post('/api/assignments', auth('teacher'), async (req, res) => {
  await db.read();
  const { title, description, dueDate } = req.body;
  if(!title || !description || !dueDate) return res.status(400).json({ message: 'Missing fields' });
  const assignment = { id: nanoid(), title, description, dueDate, status: 'Draft', createdBy: req.user.id, createdAt: new Date().toISOString() };
  db.data.assignments.push(assignment);
  await db.write();
  res.json(assignment);
});

// Update assignment (teacher) - only if Draft
app.put('/api/assignments/:id', auth('teacher'), async (req, res) => {
  await db.read();
  const { id } = req.params;
  const a = db.data.assignments.find(x => x.id === id);
  if(!a) return res.status(404).json({ message: 'Not found' });
  if(a.status !== 'Draft') return res.status(400).json({ message: 'Only Draft assignments can be edited' });
  const { title, description, dueDate } = req.body;
  Object.assign(a, { title, description, dueDate });
  await db.write();
  res.json(a);
});

// Change status (publish/complete)
app.post('/api/assignments/:id/status', auth('teacher'), async (req, res) => {
  await db.read();
  const { id } = req.params;
  const { action } = req.body; // 'publish' or 'complete'
  const a = db.data.assignments.find(x => x.id === id);
  if(!a) return res.status(404).json({ message: 'Not found' });
  if(action === 'publish') {
    if(a.status !== 'Draft') return res.status(400).json({ message: 'Only Draft can be Published' });
    a.status = 'Published';
  } else if(action === 'complete') {
    if(a.status !== 'Published') return res.status(400).json({ message: 'Only Published can be Completed' });
    a.status = 'Completed';
  } else return res.status(400).json({ message: 'Invalid action' });
  await db.write();
  res.json(a);
});

// Delete assignment (teacher) - only Draft
app.delete('/api/assignments/:id', auth('teacher'), async (req, res) => {
  await db.read();
  const { id } = req.params;
  const idx = db.data.assignments.findIndex(x => x.id === id);
  if(idx === -1) return res.status(404).json({ message: 'Not found' });
  if(db.data.assignments[idx].status !== 'Draft') return res.status(400).json({ message: 'Only Draft can be deleted' });
  db.data.assignments.splice(idx,1);
  await db.write();
  res.json({ message: 'Deleted' });
});

// List assignments (teacher: all, can filter by status)
app.get('/api/assignments', auth(), async (req, res) => {
  await db.read();
  const { status } = req.query;
  let list = db.data.assignments;
  if(status) list = list.filter(a => a.status === status);
  res.json(list);
});

// Get assignment by id
app.get('/api/assignments/:id', auth(), async (req, res) => {
  await db.read();
  const { id } = req.params;
  const a = db.data.assignments.find(x => x.id === id);
  if(!a) return res.status(404).json({ message: 'Not found' });
  res.json(a);
});

// Submit answer (student) - only if Published and before due date and only once
app.post('/api/assignments/:id/submit', auth('student'), async (req, res) => {
  await db.read();
  const { id } = req.params;
  const { answer } = req.body;
  const a = db.data.assignments.find(x => x.id === id);
  if(!a) return res.status(404).json({ message: 'Assignment not found' });
  if(a.status !== 'Published') return res.status(400).json({ message: 'Assignment not open for submissions' });
  const due = new Date(a.dueDate);
  if(new Date() > due) return res.status(400).json({ message: 'Past due date' });
  const exists = db.data.submissions.find(s => s.assignmentId === id && s.studentId === req.user.id);
  if(exists) return res.status(400).json({ message: 'Already submitted' });
  const submission = { id: nanoid(), assignmentId: id, studentId: req.user.id, studentName: req.user.name, answer, submittedAt: new Date().toISOString(), reviewed: false };
  db.data.submissions.push(submission);
  await db.write();
  res.json(submission);
});

// Get submissions for an assignment (teacher)
app.get('/api/assignments/:id/submissions', auth('teacher'), async (req, res) => {
  await db.read();
  const { id } = req.params;
  const subs = db.data.submissions.filter(s => s.assignmentId === id);
  res.json(subs);
});

// Get my submissions (student)
app.get('/api/my-submissions', auth('student'), async (req, res) => {
  await db.read();
  const subs = db.data.submissions.filter(s => s.studentId === req.user.id);
  res.json(subs);
});

// Mark submission reviewed (teacher)
app.post('/api/submissions/:id/review', auth('teacher'), async (req, res) => {
  await db.read();
  const { id } = req.params;
  const s = db.data.submissions.find(x => x.id === id);
  if(!s) return res.status(404).json({ message: 'Not found' });
  s.reviewed = true;
  await db.write();
  res.json(s);
});

// Serve simple message
app.get('/', (req, res) => res.send('Assignment Portal API running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port', PORT));
