
import React from 'react';
import { Box } from '@mui/material';
import ProjectList from '../components/ProjectList';
import './ProjectsPage.css'; // Import the new CSS file

const Projects = () => {
  return (
    <Box className="projects-page-container">
      <Box className="projects-left-panel">
        <div className="projects-branding">
          <h1 className="projects-page-title">Your Projects</h1>
          <p className="projects-page-subtitle">Manage your electronic designs</p>
        </div>
        <p className="projects-welcome-message">
          Welcome to your projects dashboard. Here you can create, view, and manage all of your electronic projects and their bills of materials.
        </p>
      </Box>
      <Box className="projects-right-panel">
        <ProjectList />
      </Box>
    </Box>
  );
};

export default Projects;
