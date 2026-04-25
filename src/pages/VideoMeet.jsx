import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { TextField, Button } from '@mui/material';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
};

export default function VideoMeetComponent() {

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();

    const [videos, setVideos] = useState([]);
    const [username, setUsername] = useState("");
    const [askForUsername, setAskForUsername] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        getPermissions();
    }, []);

    const getPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            window.localStream = stream;
            if (localVideoref.current) {
                localVideoref.current.srcObject = stream;
            }
        } catch (e) {
            console.log(e);
        }
    };

    const connectToSocketServer = () => {

        socketRef.current = io(server_url, {
            transports: ["websocket"]
        });

        socketRef.current.on("connect", () => {

            const roomId = window.location.pathname;
            socketRef.current.emit("join-call", roomId);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("signal", gotMessageFromServer);

            socketRef.current.on("user-left", (id) => {
                setVideos(v => v.filter(video => video.socketId !== id));
            });

            socketRef.current.on("user-joined", (id, clients) => {

                clients.forEach(socketListId => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
                        }
                    };

                    connections[socketListId].ontrack = (event) => {
                        let stream = event.streams[0];

                        setVideos(prev => {
                            if (prev.find(v => v.socketId === socketListId)) {
                                return prev.map(v =>
                                    v.socketId === socketListId ? { ...v, stream } : v
                                );
                            } else {
                                return [...prev, { socketId: socketListId, stream }];
                            }
                        });
                    };

                    if (window.localStream) {
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    }
                });

                if (id === socketIdRef.current) {
                    Object.keys(connections).forEach(id2 => {
                        if (id2 === socketIdRef.current) return;

                        connections[id2].createOffer()
                            .then(d => connections[id2].setLocalDescription(d))
                            .then(() => {
                                socketRef.current.emit("signal", id2,
                                    JSON.stringify({ sdp: connections[id2].localDescription })
                                );
                            });
                    });
                }
            });
        });
    };

    const gotMessageFromServer = (fromId, message) => {

        const signal = JSON.parse(message);

        if (fromId === socketIdRef.current) return;

        if (signal.sdp) {
            connections[fromId]
                .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === "offer") {
                        return connections[fromId].createAnswer();
                    }
                })
                .then(answer => {
                    if (answer) {
                        return connections[fromId].setLocalDescription(answer);
                    }
                })
                .then(() => {
                    if (connections[fromId].localDescription) {
                        socketRef.current.emit("signal", fromId,
                            JSON.stringify({ sdp: connections[fromId].localDescription })
                        );
                    }
                })
                .catch(e => console.log(e));
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
        }
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    return (
        <div>

            {askForUsername ? (
                <div>
                    <h2>Enter Lobby</h2>
                    <TextField value={username} onChange={e => setUsername(e.target.value)} />
                    <Button onClick={connect}>Join</Button>
                    <video ref={localVideoref} autoPlay muted playsInline />
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>

                    <video ref={localVideoref} autoPlay muted playsInline />

                    <div>
                        {videos.map(v => (
                            <video
                                key={v.socketId}
                                autoPlay
                                playsInline
                                ref={ref => {
                                    if (ref && v.stream) {
                                        ref.srcObject = v.stream;
                                    }
                                }}
                            />
                        ))}
                    </div>

                </div>
            )}

        </div>
    );
}