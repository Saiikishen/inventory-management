import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, createProject } from '../firebase';
import { FaTrash, FaPlay } from 'react-icons/fa';
import Modal from 'react-modal';
import './ProjectPage.css';

Modal.setAppElement('#root');

const ProjectPage = () => {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [hoveredProjectId, setHoveredProjectId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setProjects(projectsData);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateProject = async () => {
        if (!newProjectName) {
            setSnackbar({ open: true, message: 'Project name cannot be empty.', type: 'error' });
            return;
        }

        const projectId = await createProject(newProjectName);
        if (projectId) {
            setNewProjectName('');
            setSnackbar({ open: true, message: 'Project created successfully!', type: 'success' });
        } else {
            setSnackbar({ open: true, message: 'Error creating project.', type: 'error' });
        }
    };

    const openDeleteModal = (projectId) => {
        setProjectToDelete(projectId);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setProjectToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const confirmDeleteProject = async () => {
        if (projectToDelete) {
            try {
                await deleteDoc(doc(db, 'projects', projectToDelete));
                setSnackbar({ open: true, message: 'Project deleted successfully!', type: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: `Error deleting project: ${error.message}`, type: 'error' });
            } finally {
                closeDeleteModal();
            }
        }
    };

    const handleProductionRun = (projectId) => {
        navigate(`/projects/${projectId}/production`);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ open: false, message: '', type: snackbar.type });
    };

    return (
        <div className="project-page-container">
            <h1>Projects</h1>
            <div className="add-project-form">
                <input 
                    type="text" 
                    value={newProjectName} 
                    onChange={(e) => setNewProjectName(e.target.value)} 
                    placeholder="New Project Name" 
                />
                <button onClick={handleCreateProject}>Create Project</button>
            </div>

            <div className="project-list">
                {projects.map(project => (
                    <div 
                        key={project.id} 
                        className="project-item"
                        onMouseEnter={() => setHoveredProjectId(project.id)}
                        onMouseLeave={() => setHoveredProjectId(null)}
                    >
                        <Link to={`/projects/${project.id}`}>{project.name}</Link>
                        {hoveredProjectId === project.id && (
                            <div className="project-actions">
                                <button className="icon-button production-run-button" onClick={() => handleProductionRun(project.id)}><FaPlay /> </button>
                                <button className="icon-button delete-button" onClick={() => openDeleteModal(project.id)}><FaTrash /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal 
                isOpen={isDeleteModalOpen} 
                onRequestClose={closeDeleteModal} 
                contentLabel="Confirm Deletion" 
                className="modal"
                overlayClassName="overlay"
            >
                <h2>Confirm Deletion</h2>
                <p>Are you sure you want to delete this project? This action cannot be undone.</p>
                <div className="modal-actions">
                    <button onClick={confirmDeleteProject} className="run-button">Delete</button>
                    <button onClick={closeDeleteModal} className="cancel-button">Cancel</button>
                </div>
            </Modal>

            {snackbar.open && (
                <div className={`snackbar ${snackbar.type}`}>
                    {snackbar.message}
                    <button onClick={handleCloseSnackbar}>X</button>
                </div>
            )}
        </div>
    );
};

export default ProjectPage;
