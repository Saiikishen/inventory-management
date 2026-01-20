import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';
import {
    Container,
    Typography,
    Paper,
    Box,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';

const TransactionLogPage = () => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transactionsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate() // Convert Firestore Timestamp to JS Date
            }));
            setTransactions(transactionsData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom component="div" sx={{ mb: 3, fontWeight: 'bold' }}>
                Transaction Log
            </Typography>
            <Paper sx={{ p: 2 }}>
                <List>
                    {transactions.map((transaction, index) => (
                        <React.Fragment key={transaction.id}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={
                                        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                                            {transaction.type}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.primary"
                                            >
                                                {transaction.timestamp.toLocaleString()}
                                            </Typography>
                                            <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #eee' }}>
                                                {transaction.details.map((detail, i) => (
                                                    <Typography key={i} variant="body2" component="div">{detail}</Typography>
                                                ))}
                                            </Box>
                                        </Box>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                            </ListItem>
                            {index < transactions.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                    ))}
                </List>
                {transactions.length === 0 && (
                    <Typography sx={{ textAlign: 'center', p: 3, fontStyle: 'italic' }}>
                        No transactions recorded yet.
                    </Typography>
                )}
            </Paper>
        </Container>
    );
};

export default TransactionLogPage;
