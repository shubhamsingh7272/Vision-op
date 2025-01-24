import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton, Tooltip, Paper } from "@mui/material";
import Webcam from "react-webcam";
import axios from "axios";
import {
    Play,
    Pause,
    Video,
    Monitor,
    Camera,
    Download,
    FlipHorizontal,
    Mic,
    MicOff,
} from "lucide-react";

const WebcamControls = ({ onCapture3DView }) => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const screenRecorderRef = useRef(null);

    const [recording, setRecording] = useState(false);
    const [screenRecording, setScreenRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [screenChunks, setScreenChunks] = useState([]);
    const [mirrored, setMirrored] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeWebcam = async () => {
            try {
                console.log("Requesting webcam access...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 1280,
                        height: 720,
                        facingMode: "user",
                    },
                    audio: audioEnabled,
                });
                
                if (webcamRef.current) {
                    webcamRef.current.srcObject = stream;
                }
                setError(null);
            } catch (err) {
                console.error("Detailed webcam error:", err);
                setError(`Webcam error: ${err.name} - ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        initializeWebcam();

        // Cleanup function to release camera when component unmounts
        return () => {
            if (webcamRef.current && webcamRef.current.srcObject) {
                webcamRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [audioEnabled]);

    const handleFlipCamera = () => setMirrored(!mirrored);
    const toggleAudio = () => setAudioEnabled(!audioEnabled);

    const captureScreenshot = async () => {
        const screenshot = webcamRef.current.getScreenshot();
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/save-screenshot`,
                {
                    image: screenshot,
                    type: "webcam",
                }
            );
            if (response.data.success) {
                window.open(
                    `${process.env.REACT_APP_BACKEND_URL}/download-screenshot/${response.data.filename}`
                );
            }
        } catch (error) {
            console.error("Error saving screenshot:", error);
        }
    };

    const startRecording = async () => {
        try {
            const stream = webcamRef.current.video.srcObject;
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const combinedStream = new MediaStream([
                ...stream.getVideoTracks(),
                ...audioStream.getAudioTracks(),
            ]);

            const recorder = new MediaRecorder(combinedStream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const formData = new FormData();
                    formData.append("file", event.data);
                    formData.append("type", "webcam");

                    try {
                        const response = await axios.post(
                            `${process.env.REACT_APP_BACKEND_URL}/save-recording`,
                            formData
                        );
                        if (response.data.success) {
                            setRecordedChunks((prev) => [
                                ...prev,
                                response.data.filename,
                            ]);
                        }
                    } catch (error) {
                        console.error("Error saving recording:", error);
                    }
                }
            };

            recorder.start();
            setRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
        }
    };

    const startScreenRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: audioEnabled,
            });

            const recorder = new MediaRecorder(screenStream);
            screenRecorderRef.current = recorder;

            recorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const formData = new FormData();
                    formData.append("file", event.data);
                    formData.append("type", "screen");

                    try {
                        const response = await axios.post(
                            `${process.env.REACT_APP_BACKEND_URL}/save-recording`,
                            formData
                        );
                        if (response.data.success) {
                            setScreenChunks((prev) => [
                                ...prev,
                                response.data.filename,
                            ]);
                        }
                    } catch (error) {
                        console.error("Error saving screen recording:", error);
                    }
                }
            };

            recorder.start();
            setScreenRecording(true);
        } catch (err) {
            console.error("Error starting screen recording:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const stopScreenRecording = () => {
        if (screenRecorderRef.current) {
            screenRecorderRef.current.stop();
            setScreenRecording(false);
        }
    };

    const handleDownload = async (filename) => {
        window.open(
            `${process.env.REACT_APP_BACKEND_URL}/download-recording/${filename}`
        );
    };

    return (
        <Paper className="p-4" elevation={3}>
            <div className="relative">
                {isLoading ? (
                    <div className="w-full h-[300px] flex items-center justify-center">
                        Loading camera...
                    </div>
                ) : error ? (
                    <div className="w-full h-[300px] flex items-center justify-center text-red-500">
                        {error}
                    </div>
                ) : (
                    <Webcam
                        ref={webcamRef}
                        audio={audioEnabled}
                        mirrored={mirrored}
                        className="w-full rounded"
                        videoConstraints={{
                            width: 1280,
                            height: 720,
                            facingMode: "user",
                        }}
                        onUserMedia={(stream) => {
                            console.log("Webcam stream ready:", stream);
                            setIsLoading(false);
                            setError(null);
                        }}
                        onUserMediaError={(err) => {
                            console.error("Webcam component error:", err);
                            setError(
                                `Component error: ${err.name} - ${err.message}`
                            );
                        }}
                    />
                )}

                {!error && !isLoading && (
                    <div className="absolute top-2 right-2 flex gap-2 bg-white/80 rounded p-1">
                        <Tooltip title="Flip Camera">
                            <IconButton onClick={handleFlipCamera}>
                                <FlipHorizontal />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Toggle Audio">
                            <IconButton onClick={toggleAudio}>
                                {audioEnabled ? <Mic /> : <MicOff />}
                            </IconButton>
                        </Tooltip>
                    </div>
                )}
            </div>

            {!error && !isLoading && (
                <Box className="mt-4 flex flex-wrap gap-2">
                    {!recording ? (
                        <Tooltip title="Start Recording">
                            <IconButton onClick={startRecording}>
                                <Play />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Stop Recording">
                            <IconButton onClick={stopRecording}>
                                <Pause />
                            </IconButton>
                        </Tooltip>
                    )}

                    {!screenRecording ? (
                        <Tooltip title="Start Screen Recording">
                            <IconButton onClick={startScreenRecording}>
                                <Video />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Stop Screen Recording">
                            <IconButton onClick={stopScreenRecording}>
                                <Monitor />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="Take Screenshot">
                        <IconButton onClick={captureScreenshot}>
                            <Camera />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Capture 3D View">
                        <IconButton onClick={onCapture3DView}>
                            <Camera
                                className="text-blue-500 hover:text-blue-600 transform transition-all duration-200 animate-pulse"
                                size={24}
                            />
                        </IconButton>
                    </Tooltip>

                    {recordedChunks.length > 0 && (
                        <Tooltip title="Download Recording">
                            <IconButton
                                onClick={() =>
                                    handleDownload(
                                        recordedChunks[
                                            recordedChunks.length - 1
                                        ]
                                    )
                                }
                            >
                                <Download />
                            </IconButton>
                        </Tooltip>
                    )}

                    {screenChunks.length > 0 && (
                        <Tooltip title="Download Screen Recording">
                            <IconButton
                                onClick={() =>
                                    handleDownload(
                                        screenChunks[screenChunks.length - 1]
                                    )
                                }
                            >
                                <Download />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default WebcamControls;
