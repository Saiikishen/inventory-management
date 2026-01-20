import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, collection, getDocs, getDoc, arrayUnion } from "firebase/firestore";
import {
    Container,
    Typography,
    Button,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ProjectBOM = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [allComponents, setAllComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editMode, setEditMode] = useState({ index: -1, quantity: 0 });

  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {
      setLoading(true);
      try {
        const projectRef = doc(db, "projects", projectId);
        
        const projectPromise = getDoc(projectRef);
        const componentsPromise = getDocs(collection(db, "components"));

        const [projectDoc, componentsSnapshot] = await Promise.all([projectPromise, componentsPromise]);

        if (projectDoc.exists()) {
          setProject({ ...projectDoc.data(), id: projectDoc.id });
        } else {
          console.error("No such project!");
          setProject(null);
        }

        const componentsData = componentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setAllComponents(componentsData);
        
        unsubscribe = onSnapshot(projectRef, (docSnap) => {
            if (docSnap.exists()) {
                setProject({ ...docSnap.data(), id: docSnap.id });
            } else {
                setProject(null);
            }
        });

      } catch (error) {
        console.error("Error fetching project data:", error);
        setSnackbar({ open: true, message: 'Error fetching project data.', severity: 'error' });
        setProject(null); 
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [projectId]);

  const handleAddComponent = async () => {
    if (!selectedComponent || quantity <= 0) return;
    const componentToAdd = allComponents.find(c => c.id === selectedComponent);
    const projectRef = doc(db, "projects", projectId);
    try {
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
            const existingComponents = projectDoc.data().components || [];
            const existingComponentIndex = existingComponents.findIndex(c => c.id === selectedComponent);

            if (existingComponentIndex > -1) {
                // Component exists, update quantity
                const updatedComponents = [...existingComponents];
                updatedComponents[existingComponentIndex].quantity += Number(quantity);
                await updateDoc(projectRef, { components: updatedComponents });
                setSnackbar({ open: true, message: 'Component quantity updated successfully!', severity: 'success' });
            } else {
                // Component does not exist, add it
                const componentWithQuantity = {
                    id: componentToAdd.id,
                    name: componentToAdd.name,
                    category: componentToAdd.category,
                    value: componentToAdd.value || '',
                    footprint: componentToAdd.footprint || '',
                    toleranceRating: componentToAdd.toleranceRating || '',
                    manufacturer: componentToAdd.manufacturer || '',
                    quantity: Number(quantity),
                    availableStock: componentToAdd.availableStock || 0
                };
                await updateDoc(projectRef, { components: arrayUnion(componentWithQuantity) });
                setSnackbar({ open: true, message: 'Component added successfully!', severity: 'success' });
            }
            setSelectedComponent('');
            setQuantity(1);
        }
    } catch (error) {
        setSnackbar({ open: true, message: `Error adding component: ${error.message}`, severity: 'error' });
    }
  };

  const handleRemoveComponent = async (componentToRemove) => {
    const projectRef = doc(db, "projects", projectId);
    try {
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
            const existingComponents = projectDoc.data().components || [];
            const updatedComponents = existingComponents.filter(c => c.id !== componentToRemove.id);
            await updateDoc(projectRef, { components: updatedComponents });
            setSnackbar({ open: true, message: 'Component removed successfully!', severity: 'success' });
        }
    } catch (error) {
        setSnackbar({ open: true, message: `Error removing component: ${error.message}`, severity: 'error' });
    }
  };

  const handleUpdateQuantity = async (index) => {
    const projectRef = doc(db, "projects", projectId);
    try {
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
            const updatedComponents = [...projectDoc.data().components];
            updatedComponents[index].quantity = Number(editMode.quantity);
            await updateDoc(projectRef, { components: updatedComponents });
            setEditMode({ index: -1, quantity: 0 });
            setSnackbar({ open: true, message: 'Quantity updated successfully!', severity: 'success' });
        }
    } catch (error) {
        setSnackbar({ open: true, message: `Error updating quantity: ${error.message}`, severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (!project) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Project not found.</Typography>;
  }

  return (
    <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                    {project.name} - Bill of Materials
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <FormControl fullWidth sx={{ mr: 2 }}>
                    <InputLabel id="add-component-label">Add Component</InputLabel>
                    <Select
                        labelId="add-component-label"
                        value={selectedComponent}
                        onChange={(e) => setSelectedComponent(e.target.value)}
                        label="Add Component"
                    >
                        {allComponents.map(c => (
                            <MenuItem key={c.id} value={c.id}>{`${c.name} (${c.value || 'N/A'}) - ${c.footprint}`}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    sx={{ width: '120px', mr: 2 }}
                    InputProps={{ inputProps: { min: 1 } }}
                />
                <Button variant="contained" color="primary" onClick={handleAddComponent} size="large">Add</Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Footprint</TableCell>
                            <TableCell>Tolerance</TableCell>
                            <TableCell>Manufacturer</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {project.components && project.components.map((component, index) => (
                        <TableRow key={index}>
                            <TableCell component="th" scope="row">{component.name}</TableCell>
                            <TableCell>{component.category}</TableCell>
                            <TableCell>{component.value}</TableCell>
                            <TableCell>{component.footprint}</TableCell>
                            <TableCell>{component.toleranceRating}</TableCell>
                            <TableCell>{component.manufacturer}</TableCell>
                            <TableCell align="right">
                                {editMode.index === index ? (
                                    <TextField
                                        type="number"
                                        value={editMode.quantity}
                                        onChange={(e) => setEditMode({ ...editMode, quantity: e.target.value })}
                                        InputProps={{ inputProps: { min: 1 } }}
                                        size="small"
                                        sx={{ width: '80px' }}
                                    />
                                ) : (
                                    component.quantity
                                )}
                            </TableCell>
                            <TableCell align="right">
                                {editMode.index === index ? (
                                    <>
                                        <IconButton onClick={() => handleUpdateQuantity(index)} color="primary">
                                            <SaveIcon />
                                        </IconButton>
                                        <IconButton onClick={() => setEditMode({ index: -1, quantity: 0 })}>
                                            <CancelIcon />
                                        </IconButton>
                                    </>
                                ) : (
                                    <IconButton onClick={() => setEditMode({ index, quantity: component.quantity })} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                )}
                                <IconButton onClick={() => handleRemoveComponent(component)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {(!project.components || project.components.length === 0) && (
                <Typography sx={{ textAlign: 'center', mt: 3, fontStyle: 'italic' }}>
                    This project has no components yet. Add one from the dropdown above.
                </Typography>
            )}
        </Paper>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
    </Container>
  );
};

export default ProjectBOM;
