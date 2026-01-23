import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, writeBatch, doc } from "firebase/firestore";
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
    Container,
    Typography,
    Paper,
    Box,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';

const TransactionLogPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                user.getIdTokenResult().then(idTokenResult => {
                    setIsAdmin(!!idTokenResult.claims.admin);
                });
            } else {
                setUser(null);
                setIsAdmin(false);
            }
        });

        const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
        const unsubscribeTransactions = onSnapshot(q, (querySnapshot) => {
            const transactionsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate() // Convert Firestore Timestamp to JS Date
            }));
            setTransactions(transactionsData);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeTransactions();
        };
    }, []);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleDelete = async () => {
        const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
            Type: t.type,
            Timestamp: t.timestamp.toLocaleString(),
            Details: t.details.join('\n')
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], {type: "application/octet-stream"});
        saveAs(data, 'transaction-log.xlsx');

        const batch = writeBatch(db);
        transactions.forEach(transaction => {
            const docRef = doc(db, "transactions", transaction.id);
            batch.delete(docRef);
        });
        await batch.commit();

        handleClose();
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                    Transaction Log
                </Typography>
                {isAdmin && (
                    <Button variant="contained" color="error" onClick={handleOpen}>
                        Delete Log
                    </Button>
                )}
            </Box>
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
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle>Delete Transaction Log?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the entire transaction log? This action will download the log as an Excel file and then permanently delete it. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TransactionLogPage;
