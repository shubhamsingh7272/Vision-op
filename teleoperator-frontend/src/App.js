import React, { useState } from "react";
import {
    Box,
    Grid,
    Paper,
    Typography,
    Tooltip,
    IconButton,
} from "@mui/material";
import axios from "axios";
import { Camera } from "@mui/icons-material";
import PointCloudViewer from "./components/PointCloudViewer";
import WebcamControls from "./components/WebCamControls";
import SystemMetrics from "./components/SystemMetrics";

const App = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handle3DCapture = async () => {
        const canvas = document.querySelector("canvas");
        if (!canvas) return;

        try {
            const screenshot = canvas.toDataURL();
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/save-screenshot`,
                {
                    image: screenshot,
                    type: "3d",
                }
            );
            if (response.data.success) {
                window.open(
                    `${process.env.REACT_APP_BACKEND_URL}/download-screenshot/${response.data.filename}`
                );
            }
        } catch (error) {
            console.error("Error saving 3D screenshot:", error);
        }
    };

    return (
        <Box className="min-h-screen bg-gray-900 p-4">
            <Grid container spacing={3}>
                <Grid item xs={12} md={isFullscreen ? 12 : 8}>
                    <Paper className="p-4" elevation={3}>
                        <PointCloudViewer
                            isFullscreen={isFullscreen}
                            setIsFullscreen={setIsFullscreen}
                        />
                    </Paper>
                </Grid>

                {!isFullscreen && (
                    <Grid item xs={12} md={4}>
                        <WebcamControls onCapture3DView={handle3DCapture} />
                        {/* have to fix the full screen issue*/}
                        <Paper className="p-4 mt-4 h-[39vh]" elevation={3}>
                            <Typography variant="h6" className="mb-4">
                                System Metrics
                            </Typography>
                            <SystemMetrics />
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default App;
