import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import Api from '../services/api';
import { AuthContext } from '../App';

export default function StudentDashboard(){
  const { auth, setAuth } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [mySubs, setMySubs] = useState([]);

  async function load(){
    const list = await Api.getAssignments('Published');
    setAssignments(list);
    const subs = await Api.mySubmissions();
    setMySubs(subs);
  }

  useEffect(()=>{ load(); }, []);

  async function submit(id){
    const answer = prompt('Enter your answer (text):');
    if(!answer) return;
    await Api.submitAnswer(id, answer);
    load();
  }

  function myAnswerFor(id){
    const s = mySubs.find(x=>x.assignmentId===id);
    return s ? s.answer : null;
  }

  return (
    <Box>
      <Typography variant="h6">Welcome, {auth.name} (Student)</Typography>
      <Button onClick={()=>{ Api.logout(); setAuth(null); }}>Logout</Button>

      <Box sx={{my:2}}>
        {assignments.map(a=>(
          <Paper key={a.id} sx={{p:2, my:1}}>
            <Typography variant="subtitle1">{a.title}</Typography>
            <Typography variant="body2">{a.description}</Typography>
            <Typography variant="caption">Due: {a.dueDate}</Typography>
            <Box sx={{mt:1}}>
              {myAnswerFor(a.id) ? <Typography>Submitted: {myAnswerFor(a.id)}</Typography> : <Button onClick={()=>submit(a.id)}>Submit</Button>}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
