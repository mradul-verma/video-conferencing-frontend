import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AuthContext } from '../contexts/AuthContext';

function generateMeetingId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [openInvite, setOpenInvite] = useState(false);

    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode || meetingCode.trim() === "") {
            alert("Please enter a meeting code")
            return
        }
        try {
            await addToUserHistory(meetingCode)
        } catch (e) {
            console.log("Error adding to history:", e)
        }
        window.location.href = `/${meetingCode.trim()}`;
    }

    let handleCreateMeeting = async () => {
        const newMeetingId = generateMeetingId();
        setMeetingCode(newMeetingId);
        setOpenInvite(true);
        try {
            await addToUserHistory(newMeetingId)
        } catch (e) {
            console.log("Error adding to history:", e)
        }
    }

    let handleCopyLink = () => {
        const link = `${window.location.origin}/${meetingCode.trim()}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    let handleShareWhatsApp = () => {
        const link = `${window.location.origin}/${meetingCode.trim()}`;
        const text = `Join my Meetify video call: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }

    const meetingLink = `${window.location.origin}/${meetingCode.trim()}`;

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Meetify</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={() => navigate("/history")}>
                        <RestoreIcon />
                    </IconButton>
                    <p style={{ margin: '0 15px 0 5px', cursor: 'pointer' }}>History</p>
                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Premium Video Conferencing</h2>
                        <p style={{ color: '#666', marginTop: '10px', marginBottom: '20px' }}>Connect with anyone, anywhere in HD quality</p>

                        <div style={{ display: 'flex', gap: "10px", marginBottom: '20px' }}>
                            <TextField 
                                onChange={e => setMeetingCode(e.target.value)} 
                                id="outlined-basic" 
                                label="Meeting Code" 
                                variant="outlined"
                                value={meetingCode}
                                placeholder="Enter or create a meeting"
                            />
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
                        </div>

                        <Button 
                            onClick={handleCreateMeeting} 
                            variant="outlined"
                            startIcon={<AddIcon />}
                            style={{ 
                                borderRadius: '25px',
                                borderColor: '#667eea',
                                color: '#667eea'
                            }}
                        >
                            New Meeting
                        </Button>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="" />
                </div>
            </div>

            <Dialog open={openInvite} onClose={() => setOpenInvite(false)} maxWidth="sm" fullWidth>
                <DialogTitle style={{ textAlign: 'center' }}>
                    <CheckCircleIcon style={{ color: '#4CAF50', fontSize: 50 }} />
                    <div>Meeting Created!</div>
                </DialogTitle>
                <DialogContent>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <p style={{ color: '#666', marginBottom: '10px' }}>Share this link with others to join:</p>
                        <div style={{ 
                            background: '#f5f5f5', 
                            padding: '15px', 
                            borderRadius: '10px',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace'
                        }}>
                            {meetingLink}
                        </div>
                    </div>
                </DialogContent>
                <DialogActions style={{ justifyContent: 'center', padding: '20px' }}>
                    <Button 
                        onClick={handleCopyLink} 
                        variant="contained"
                        startIcon={<ContentCopyIcon />}
                        style={{ background: '#667eea' }}
                    >
                        {copied ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button 
                        onClick={handleShareWhatsApp} 
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        style={{ background: '#25D366' }}
                    >
                        Share on WhatsApp
                    </Button>
                    <Button 
                        onClick={() => window.location.href = meetingLink} 
                        variant="contained"
                        startIcon={<ShareIcon />}
                    >
                        Join Now
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default withAuth(HomeComponent);