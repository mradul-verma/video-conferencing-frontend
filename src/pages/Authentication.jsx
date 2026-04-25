
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Snackbar } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';


const defaultTheme = createTheme();

export default function Authentication() {

    const { handleLogin, handleRegister } = useAuth();

    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();


    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false)


    
    let handleAuth = async () => {
        try {
            if (formState === 0) {

                let result = await handleLogin(username, password)


            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)
                setPassword("")
            }
        } catch (err) {

            console.log(err);
            let message = (err.response.data.message);
            setError(message);
        }
    }


    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <Paper elevation={8} style={{
                padding: '40px',
                borderRadius: '20px',
                maxWidth: '450px',
                width: '100%'
            }}>
                <Box style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Avatar sx={{ m: '0 auto', width: 60, height: 60, bgcolor: '#667eea' }}>
                        <LockOutlinedIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                    <Typography variant="h4" style={{ marginTop: '15px', fontWeight: 600, color: '#1a1a2e' }}>
                        Welcome
                    </Typography>
                </Box>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center' }}>
                    <Button 
                        variant={formState === 0 ? "contained" : "outlined"} 
                        onClick={() => { setFormState(0) }}
                        style={{ 
                            borderRadius: '20px',
                            background: formState === 0 ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: formState === 0 ? 'white' : '#667eea',
                            borderColor: '#667eea'
                        }}
                    >
                        Sign In
                    </Button>
                    <Button 
                        variant={formState === 1 ? "contained" : "outlined"} 
                        onClick={() => { setFormState(1) }}
                        style={{ 
                            borderRadius: '20px',
                            background: formState === 1 ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: formState === 1 ? 'white' : '#667eea',
                            borderColor: '#667eea'
                        }}
                    >
                        Sign Up
                    </Button>
                </div>

                <Box component="form" noValidate sx={{ mt: 1 }}>
                    {formState === 1 ? <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Full Name"
                        name="username"
                        value={name}
                        autoFocus
                        onChange={(e) => setName(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    /> : <></>}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        value={username}
                        autoFocus
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        value={password}
                        type="password"
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />

                    <p style={{ color: "red", margin: '10px 0' }}>{error}</p>

                    <Button
                        type="button"
                        fullWidth
                        variant="contained"
                        onClick={handleAuth}
                        style={{ 
                            mt: 3, 
                            mb: 2,
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '25px',
                            padding: '12px',
                            fontSize: '16px',
                            fontWeight: 600
                        }}
                    >
                        {formState === 0 ? "Sign In" : "Sign Up"}
                    </Button>

                </Box>
            </Paper>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
            />
        </div>
    );
}