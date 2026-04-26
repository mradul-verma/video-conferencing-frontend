import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { TextField, Button, IconButton } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;

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
    const localStreamRef = useRef();
    const connectionsRef = useRef({});

    const [videos, setVideos] = useState([]);
    const [username, setUsername] = useState("");
    const [askForUsername, setAskForUsername] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState("");
    const chatEndRef = useRef(null);

    useEffect(() => {
        getPermissions();

        return () => {
            // Cleanup on unmount
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            Object.values(connectionsRef.current).forEach(pc => pc.close());
            connectionsRef.current = {};
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    const getPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
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
        });

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("user-left", (id) => {
            setVideos(v => v.filter(video => video.socketId !== id));
            if (connectionsRef.current[id]) {
                connectionsRef.current[id].close();
                delete connectionsRef.current[id];
            }
        });

        socketRef.current.on("user-joined", (id, clients) => {
            clients.forEach(socketListId => {
                if (socketListId === socketIdRef.current) return;
                if (connectionsRef.current[socketListId]) return;

                const pc = new RTCPeerConnection(peerConfigConnections);
                connectionsRef.current[socketListId] = pc;

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketRef.current.emit("signal", socketListId,
                            JSON.stringify({ ice: event.candidate })
                        );
                    }
                };

                pc.ontrack = (event) => {
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

                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => {
                        pc.addTrack(track, localStreamRef.current);
                    });
                }
            });

            // Only the last user sends offers to avoid collision
            const isLastUser = clients[clients.length - 1] === socketIdRef.current;

            if (isLastUser) {
                Object.keys(connectionsRef.current).forEach(peerId => {
                    const pc = connectionsRef.current[peerId];
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

        socketRef.current.on("chat-message", (msg, user, senderId) => {
            setChatMessages(prev => [...prev, { message: msg, username: user, senderId }]);
        });
    };

    const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);

        if (fromId === socketIdRef.current) return;
        if (!connectionsRef.current[fromId]) return;

        if (signal.sdp) {
            connectionsRef.current[fromId]
                .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === "offer") {
                        return connectionsRef.current[fromId].createAnswer();
                    }
                })
                .then(answer => {
                    if (answer) {
                        return connectionsRef.current[fromId].setLocalDescription(answer);
                    }
                })
                .then(() => {
                    if (connectionsRef.current[fromId].localDescription) {
                        socketRef.current.emit("signal", fromId,
                            JSON.stringify({ sdp: connectionsRef.current[fromId].localDescription })
                        );
                    }
                })
                .catch(e => console.log(e));
        }

        if (signal.ice) {
            connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(e => console.log(e));
        }
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioEnabled;
                setAudioEnabled(!audioEnabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoEnabled;
                setVideoEnabled(!videoEnabled);
            }
        }
    };

    const sendMessage = () => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit("chat-message", message, username);
            setMessage("");
        }
    };

    return (
        <div className={styles.meetVideoContainer}>

            {askForUsername ? (
                <div className={styles.lobby}>
                    <h2>Enter Lobby</h2>
                    <TextField value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name" />
                    <Button variant="contained" onClick={connect}>Join</Button>
                    <video ref={localVideoref} autoPlay muted playsInline className={styles.preview} />
                </div>
            ) : (
                <>
                    <video ref={localVideoref} autoPlay muted playsInline className={styles.meetUserVideo} />

                    {videos.length === 0 && (
                        <h2 className={styles.waitingText}>
                            Waiting for others to join...
                        </h2>
                    )}

                    <div className={styles.conferenceView}>
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

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={toggleAudio} style={{ color: 'white' }}>
                            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        <IconButton onClick={toggleVideo} style={{ color: 'white' }}>
                            {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={() => setShowChat(!showChat)} style={{ color: 'white' }}>
                            <ChatIcon />
                        </IconButton>
                    </div>

                    {showChat && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chattingDisplay}>
                                {chatMessages.map((msg, index) => (
                                    <div key={index} style={{ marginBottom: '10px', textAlign: msg.senderId === socketIdRef.current ? 'right' : 'left' }}>
                                        <strong>{msg.username}</strong>
                                        <p style={{ margin: 0, background: msg.senderId === socketIdRef.current ? '#dcf8c6' : '#fff', padding: '5px 10px', borderRadius: '10px', display: 'inline-block' }}>
                                            {msg.message}
                                        </p>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <div className={styles.chattingArea}>
                                <TextField
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    size="small"
                                    fullWidth
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <Button variant="contained" onClick={sendMessage}><SendIcon /></Button>
                            </div>
                        </div>
                    )}
                </>
            )}

        </div>
    );
}

