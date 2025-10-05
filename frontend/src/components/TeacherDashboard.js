import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, TextField, Select, MenuItem, Typography, Paper } from '@mui/material';
import Api from '../services/api';
import { AuthContext } from '../App';

export default function TeacherDashboard(){
  const { auth, setAuth } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title:'', description:'', dueDate:'' });

  async function load(){
    const list = await Api.getAssignments(filter || undefined);
    setAssignments(list);
  }

  useEffect(()=>{ load(); }, [filter]);

  async function create(){
    await Api.createAssignment(form);
    setForm({ title:'', description:'', dueDate:'' });
    load();
  }

  async function publish(id){ await Api.changeStatus(id, 'publish'); load(); }
  async function complete(id){ await Api.changeStatus(id, 'complete'); load(); }
  async function remove(id){ await Api.deleteAssignment(id); load(); }
  async function viewSubs(id){
    const s = await Api.getSubmissions(id);
    alert(JSON.stringify(s, null, 2));
  }

  return (
    <Box>
      <Typography variant="h6">Welcome, {auth.name} (Teacher)</Typography>
      <Button onClick={()=>{ Api.logout(); setAuth(null); }}>Logout</Button>

      <Paper sx={{p:2, my:2}}>
        <Typography variant="subtitle1">Create Assignment</Typography>
        <TextField label="Title" fullWidth sx={{my:1}} value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
        <TextField label="Description" fullWidth sx={{my:1}} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <TextField label="Due Date (ISO)" fullWidth sx={{my:1}} value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} />
        <Button variant="contained" onClick={create}>Create</Button>
      </Paper>

      <Box sx={{my:2}}>
        <Select value={filter} onChange={e=>setFilter(e.target.value)} sx={{mb:2}}>
          <MenuItem value=''>All</MenuItem>
          <MenuItem value='Draft'>Draft</MenuItem>
          <MenuItem value='Published'>Published</MenuItem>
          <MenuItem value='Completed'>Completed</MenuItem>
        </Select>

        {assignments.map(a=>(
          <Paper key={a.id} sx={{p:2, my:1}}>
            <Typography variant="subtitle1">{a.title} — {a.status}</Typography>
            <Typography variant="body2">{a.description}</Typography>
            <Typography variant="caption">Due: {a.dueDate}</Typography>
            <Box sx={{mt:1}}>
              {a.status === 'Draft' && <>
                <Button onClick={()=>publish(a.id)}>Publish</Button>
                <Button onClick={()=>remove(a.id)}>Delete</Button>
              </>}
              {a.status === 'Published' && <>
                <Button onClick={()=>complete(a.id)}>Complete</Button>
                <Button onClick={()=>viewSubs(a.id)}>View Submissions</Button>
              </>}
              {a.status === 'Completed' && <Button onClick={()=>viewSubs(a.id)}>View Submissions</Button>}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
