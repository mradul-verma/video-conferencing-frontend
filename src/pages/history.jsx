import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import withAuth from '../utils/withAuth';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

const cardStyle = {
    margin: '15px 0',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    border: 'none'
};

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }
        fetchHistory();
    }, [])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
            padding: '30px'
        }}>
            <Box style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <h2 style={{ margin: 0, color: '#1a1a2e' }}>Meeting History</h2>
                <Button 
                    variant="contained" 
                    startIcon={<HomeIcon />}
                    onClick={() => routeTo("/home")}
                    style={{ 
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '20px'
                    }}
                >
                    Home
                </Button>
            </Box>

            <Box style={{ maxWidth: '600px', margin: '0 auto' }}>
                {meetings && meetings.length > 0 ? meetings.map((e, i) => {
                    return (
                        <Card key={i} style={cardStyle}>
                            <CardContent>
                                <Typography sx={{ fontSize: 18, fontWeight: 600 }} color="#1a1a2e" gutterBottom>
                                    Meeting Code: {e.meetingCode}
                                </Typography>
                                <Typography sx={{ mb: 1.5, color: '#666' }}>
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button 
                                    size="small" 
                                    variant="contained"
                                    onClick={() => window.location.href = `/${e.meetingCode}`}
                                    style={{ 
                                        background: '#667eea',
                                        borderRadius: '15px'
                                    }}
                                >
                                    Join Again
                                </Button>
                            </CardActions>
                        </Card>
                    )
                }) : (
                    <Box style={{ textAlign: 'center', padding: '50px' }}>
                        <Typography variant="h6" color="text.secondary">
                            No meetings yet. Start a new meeting from the home page!
                        </Typography>
                    </Box>
                )}
            </Box>
        </div>
    )
}

export default withAuth(History);