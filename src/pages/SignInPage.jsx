import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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

const SignInPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const auth = getAuth();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user.emailVerified) {
                navigate('/');
            } else {
                await auth.signOut();
                setError('Please verify your email before signing in. A verification email has been sent to your inbox.');
            }
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
                    Sign In
                </Typography>
                <Typography component="h2" variant="subtitle1" sx={{ color: '#666', mb: 3 }}>
                    Welcome back!
                </Typography>
                <Box component="form" onSubmit={handleSignIn} noValidate sx={{ mt: 1 }}>
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
                        autoComplete="current-password"
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
                        Sign In
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/signup" variant="body2" sx={{ color: '#171719' }}>
                            {"Don't have an account? Sign Up"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default SignInPage;
