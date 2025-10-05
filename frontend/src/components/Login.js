import React, { useState, useContext } from 'react';
import { TextField, Button, Box, Alert } from '@mui/material';
import Api from '../services/api';
import { AuthContext } from '../App';

export default function Login(){
  const { setAuth } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function handleLogin(){
    setErr('');
    try {
      const res = await Api.login(email, password);
      setAuth(res);
      localStorage.setItem('auth', JSON.stringify(res));
    } catch (e){
      setErr(e.message || 'Login failed');
    }
  }

  return (
    <Box sx={{maxWidth:400}}>
      {err && <Alert severity="error" sx={{mb:2}}>{err}</Alert>}
      <TextField label="Email" fullWidth sx={{mb:2}} value={email} onChange={e=>setEmail(e.target.value)} />
      <TextField label="Password" type="password" fullWidth sx={{mb:2}} value={password} onChange={e=>setPassword(e.target.value)} />
      <Button variant="contained" onClick={handleLogin}>Login</Button>
    </Box>
  );
}
