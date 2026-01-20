import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Paper
} from '@mui/material';

const SignUpPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const auth = getAuth();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={6} sx={{
                marginTop: 8,
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f0f0f3 0%, #e16d1f 100%)',
            }}>
                <Typography component="h1" variant="h5" sx={{ color: '#171719', fontWeight: '700' }}>
                    Sign Up
                </Typography>
                <Typography component="h2" variant="subtitle1" sx={{ color: '#666', mb: 3 }}>
                    Create your account
                </Typography>
                <Box component="form" onSubmit={handleSignUp} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                            {error}
                        </Typography>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            mb: 2,
                            bgcolor: '#171719',
                            '&:hover': {
                                bgcolor: '#e16d1f',
                            },
                        }}
                    >
                        Sign Up
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/signin" variant="body2" sx={{ color: '#171719' }}>
                            {"Already have an account? Sign In"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default SignUpPage;
