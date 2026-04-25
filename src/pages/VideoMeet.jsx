import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { TextField, Button } from '@mui/material';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;
let connections = {};

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
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
            transports: ["websocket"],
            upgrade: false,
            reconnection: true
        });

        socketRef.current.on("connect", () => {
            console.log("SOCKET CONNECTED");

            const roomId = window.location.pathname;
            socketRef.current.emit("join-call", roomId);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("signal", gotMessageFromServer);

            socketRef.current.on("user-left", (id) => {
                setVideos(v => v.filter(video => video.socketId !== id));
            });

          socketRef.current.on("user-joined", (id, clients) => {

    clients.forEach(socketListId => {

        if (socketListId === socketIdRef.current) return;
        if (connections[socketListId]) return;

        const pc = new RTCPeerConnection(peerConfigConnections);
        connections[socketListId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("signal", socketListId,
                    JSON.stringify({ ice: event.candidate })
                );
            }
        };

        pc.ontrack = (event) => {
            console.log("TRACK RECEIVED FROM:", socketListId);

            const stream = event.streams[0];

            setVideos(prev => {
                const exists = prev.find(v => v.socketId === socketListId);
                if (exists) {
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
                pc.addTrack(track, window.localStream);
            });
        }
    });

    // 🔥 ONLY LAST USER SENDS OFFER (NO COLLISION)
    const isLastUser = clients[clients.length - 1] === socketIdRef.current;

    if (isLastUser) {
        Object.keys(connections).forEach(peerId => {

            const pc = connections[peerId];
            if (!pc) return;

            pc.createOffer()
                .then(d => pc.setLocalDescription(d))
                .then(() => {
                    socketRef.current.emit("signal", peerId,
                        JSON.stringify({ sdp: pc.localDescription })
                    );
                })
                .catch(e => console.log(e));
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
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(e => console.log(e));
        }
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    return (
        <div className={styles.container}>

            {askForUsername ? (
                <div className={styles.lobby}>
                    <h2>Enter Lobby</h2>
                    <TextField value={username} onChange={e => setUsername(e.target.value)} />
                    <Button variant="contained" onClick={connect}>Join</Button>
                    <video ref={localVideoref} autoPlay muted playsInline className={styles.preview}/>
                </div>
            ) : (
                <div className={styles.meet}>

                    <video ref={localVideoref} autoPlay muted playsInline className={styles.mainVideo}/>

                    {videos.length === 0 && (
                        <h2 className={styles.waitingText}>
                            Waiting for others to join...
                        </h2>
                    )}

                    <div className={styles.grid}>
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
                                className={styles.remoteVideo}
                            />
                        ))}
                    </div>

                </div>
            )}

        </div>
    );
}