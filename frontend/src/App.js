import React, { useState, useEffect, createContext } from 'react';
import { Container, Typography, Box } from '@mui/material';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import Api from './services/api';

export const AuthContext = createContext();

function App(){
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if(auth) localStorage.setItem('auth', JSON.stringify(auth));
    else localStorage.removeItem('auth');
  }, [auth]);

  return (
    <AuthContext.Provider value={{auth, setAuth}}>
      <Container maxWidth="md">
        <Box sx={{py:4}}>
          <Typography variant="h4" gutterBottom>Assignment Workflow Portal</Typography>
          {!auth && <Login />}
          {auth && auth.role === 'teacher' && <TeacherDashboard />}
          {auth && auth.role === 'student' && <StudentDashboard />}
        </Box>
      </Container>
    </AuthContext.Provider>
  );
}

export default App;
