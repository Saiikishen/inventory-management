import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, getDoc, writeBatch, deleteDoc, addDoc, Timestamp } from "firebase/firestore";
import { 
    Grid,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Typography,
    Button,
    TextField,
    Box,
    Paper,
    Snackbar,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // State for production dialogs
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [insufficientStockDialogOpen, setInsufficientStockDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [insufficientStockComponents, setInsufficientStockComponents] = useState([]);
  const [componentsForProduction, setComponentsForProduction] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setProjects(projectsData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddProject = async () => {
    if (newProjectName.trim() === '') return;
    try {
      await addDoc(collection(db, "projects"), { name: newProjectName, createdAt: new Date() });
      setNewProjectName('');
      setSnackbar({ open: true, message: 'Project added successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await deleteDoc(doc(db, "projects", id));
      setSnackbar({ open: true, message: 'Project deleted successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleOpenProductionDialog = (project) => {
    setSelectedProject(project);
    setProductionDialogOpen(true);
  };

  const handleCloseProductionDialog = () => {
    setProductionDialogOpen(false);
    setSelectedProject(null);
    setProductionQuantity(1);
  };

  const handleCreateProduction = async () => {
    if (!selectedProject || productionQuantity <= 0) return;

    const requiredComponents = (selectedProject.components || []).map(c => ({
        ...c,
        requiredQuantity: c.quantity * productionQuantity
    }));

    const componentsWithStock = await Promise.all(
        requiredComponents.map(async (c) => {
            if (!c.id) {
                console.error("Component in project is missing an ID:", c);
                return { ...c, stock: 0 };
            }
            const componentDoc = await getDoc(doc(db, 'components', c.id));
            return { ...c, stock: componentDoc.exists() ? componentDoc.data().quantity || 0 : 0 };
        })
    );

    const insufficient = componentsWithStock.filter(c => c.stock < c.requiredQuantity);
    
    if (insufficient.length > 0) {
        setInsufficientStockComponents(insufficient);
        setComponentsForProduction(componentsWithStock);
        setInsufficientStockDialogOpen(true);
    } else {
        const batch = writeBatch(db);
        const details = [
            `Project: ${selectedProject.name}`,
            `Quantity Produced: ${productionQuantity}`,
            'Components Used:',
        ];

        componentsWithStock.forEach(c => {
            const componentRef = doc(db, 'components', c.id);
            const newStock = c.stock - c.requiredQuantity;
            batch.update(componentRef, { quantity: newStock });
            details.push(`- ${c.name}: Used ${c.requiredQuantity}.`);
        });

        const transactionRef = doc(collection(db, 'transactions'));
        batch.set(transactionRef, {
            type: 'Production Run',
            timestamp: Timestamp.now(),
            details: details
        });

        await batch.commit();
        setSnackbar({ open: true, message: 'Production run successful! Stock updated.', severity: 'success' });
        handleCloseProductionDialog();
    }
  };


  const handleCloseInsufficientStockDialog = () => {
    setInsufficientStockDialogOpen(false);
    setInsufficientStockComponents([]);
    setComponentsForProduction([]);
  };

  const handleForceProduction = async () => {
    const batch = writeBatch(db);
    const details = [
        `Project: ${selectedProject.name}`,
        `Quantity Produced: ${productionQuantity}`,
        'Components Used (Forced Production):',
    ];

    componentsForProduction.forEach(c => {
        const componentRef = doc(db, 'components', c.id);
        const newStock = c.stock < c.requiredQuantity ? 0 : c.stock - c.requiredQuantity;
        batch.update(componentRef, { quantity: newStock });
        
        const stockUsed = c.stock < c.requiredQuantity ? c.stock : c.requiredQuantity;
        const detailString = `- ${c.name}: Used ${stockUsed}. Required: ${c.requiredQuantity}. Available: ${c.stock}.`;
        details.push(detailString);
    });

    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
        type: 'Forced Production Run',
        timestamp: Timestamp.now(),
        details: details
    });

    await batch.commit();
    setSnackbar({ open: true, message: 'Forced production run created! Stock updated.', severity: 'success' });

    handleCloseInsufficientStockDialog();
    handleCloseProductionDialog();
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 4, mt: 4 }}>
        <Paper elevation={0} sx={{ p: 4, mb: 4, backgroundColor: 'transparent' }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                Create a New Project
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    label="Project Name"
                    variant="standard"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    sx={{ flexGrow: 1, mr: 2 }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
                />
                <Button 
                    variant="contained" 
                    onClick={handleAddProject} 
                    size="large"
                    startIcon={<AddIcon />}
                    sx={{ 
                        backgroundColor: '#e16d1f', 
                        color: 'white',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        '&:hover': {
                            backgroundColor: '#d15e1a'
                        }
                    }}
                >
                    Add Project
                </Button>
            </Box>
        </Paper>

        <Grid container spacing={4}>
            {projects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card 
                        sx={{
                            textDecoration: 'none',
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            transition: 'transform 0.2s', 
                            '&:hover': { transform: 'scale(1.03)' },
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}
                    >
                        <CardContent component={Link} to={`/project/${project.id}`} sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                                {project.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {project.components ? `${project.components.length} components` : '0 components'}
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                            <IconButton 
                                aria-label="create production"
                                onClick={() => handleOpenProductionDialog(project)}
                                color="primary"
                            >
                                <BuildIcon />
                            </IconButton>
                            <IconButton 
                                aria-label="delete project"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteProject(project.id);
                                }}
                                sx={{ color: 'error.main' }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Grid>

        {projects.length === 0 && (
            <Typography sx={{ textAlign: 'center', mt: 5, fontStyle: 'italic' }}>
                No projects found. Create one to get started.
            </Typography>
        )}

        {/* Production Dialog */}
        <Dialog open={productionDialogOpen} onClose={handleCloseProductionDialog}>
            <DialogTitle>Create Production Run</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Enter the number of units to produce for <strong>{selectedProject?.name}</strong>.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Quantity"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={productionQuantity}
                    onChange={(e) => setProductionQuantity(e.target.value)}
                    InputProps={{ inputProps: { min: 1 } }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseProductionDialog}>Cancel</Button>
                <Button onClick={handleCreateProduction} variant="contained">Create</Button>
            </DialogActions>
        </Dialog>

        {/* Insufficient Stock Dialog */}
        <Dialog open={insufficientStockDialogOpen} onClose={handleCloseInsufficientStockDialog}>
            <DialogTitle>Insufficient Stock</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    The following components have insufficient stock. Do you want to proceed anyway? This will set their stock to 0.
                </DialogContentText>
                <List>
                    {insufficientStockComponents.map(c => (
                        <ListItem key={c.id} divider>
                            <ListItemText 
                                primary={c.name}
                                secondary={`Required: ${c.requiredQuantity} | Available: ${c.stock} | Need to order: ${c.requiredQuantity - c.stock}`}
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseInsufficientStockDialog}>Cancel</Button>
                <Button onClick={handleForceProduction} variant="contained" color="warning">Proceed</Button>
            </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
    </Box>
  );
};

export default ProjectList;
