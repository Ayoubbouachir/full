import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

function TeamDetail() {
	const [member, setMember] = useState(null);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState(null);
	const location = useLocation();
	const navigate = useNavigate();
	const id = new URLSearchParams(location.search).get('id');

	// Reservation State
	const [showResModal, setShowResModal] = useState(false);
	const [resData, setResData] = useState({
		date: '',
		time: '',
		serviceType: 'Consultation',
		notes: ''
	});

	// Chat State
	const [showChatModal, setShowChatModal] = useState(false);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState('');
	const [notification, setNotification] = useState({ show: false, message: '', type: '' });
	const socketRef = useRef();
	const chatEndRef = useRef(null);

	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			setCurrentUser(JSON.parse(storedUser));
		}

		if (id) {
			fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/users/Find/${id}`)
				.then(res => res.json())
				.then(data => {
					setMember(data);
					setLoading(false);
				})
				.catch(err => {
					console.error("Error fetching worker details:", err);
					setLoading(false);
				});
		}
	}, [id]);

	// Notification helper
	const showNotification = (message, type = 'info') => {
		console.log('🔔 SHOWING NOTIFICATION:', message, 'Type:', type);
		setNotification({ show: true, message, type });

		// Auto-hide after 3 seconds
		setTimeout(() => {
			setNotification({ show: false, message: '', type: '' });
		}, 3000);

		// Optional: Play a subtle sound (you can remove this if you don't want sound)
		try {
			const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSh+zPLaizsKFGCy6OyrWBQLSKDf8sFuJAUuhM/z2Ik2Bhxqvu7pn04QDFCn4/C2YhwGOI/X8sx5LAUkd8fw3ZBACRVetOnrqFUUCkaf4PK+bCEFK4HO8tmJNggYZLns6KFQEQtMpeHxuWUcBTaN1fPOfS8FKH7M8tqLOwoUYLLo7KtYFAtIoN/ywW4kBS6Ez/PYiTYGHGq+7umfThAMUKfj8LZiHAY4j9fyzHksBSR3x/DdkEAJFV606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBhkuezooVARC0yl4fG5ZRwFNo3V885');
			audio.volume = 0.3;
			audio.play().catch(() => { }); // Ignore if audio fails
		} catch (e) {
			// Silently fail if audio doesn't work
		}

		// Also show browser notification if chat is not focused
		if (type === 'received' && document.hidden) {
			try {
				if (Notification.permission === 'granted') {
					new Notification('New Message', {
						body: message,
						icon: '/assets/images/bmp.png'
					});
				}
			} catch (e) {
				console.log('Browser notification not supported');
			}
		}
	};

	// Socket.io initialization - STABLE CONNECTION
	useEffect(() => {
		if (!id || !currentUser) {
			console.log('⏸️ Waiting for user data before connecting socket...');
			return;
		}

		console.log('🔌 Initializing socket connection...');
		console.log('Current User ID:', currentUser._id);
		console.log('Profile/Worker ID:', id);

		const socket = io('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net', {
			transports: ['websocket'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 3,
			timeout: 10000
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('✅ Connected to socket server. Socket ID:', socket.id);
			console.log('Requesting chat history between:', currentUser._id, 'and', id);
			socket.emit('getChatHistory', {
				user1: String(currentUser._id),
				user2: String(id)
			});
		});

		socket.on('receiveMessage', (message) => {
			console.log('📩 New message received:', message);
			console.log('  - Message senderId:', message.senderId);
			console.log('  - Message receiverId:', message.receiverId);
			console.log('  - Current user ID:', currentUser._id);
			console.log('  - Profile ID:', id);

			// Convert all to strings for comparison
			const msgSender = String(message.senderId);
			const msgReceiver = String(message.receiverId);
			const myId = String(currentUser._id);
			const theirId = String(id);

			// Check if this message belongs to this conversation
			const isSentByMe = msgSender === myId && msgReceiver === theirId;
			const isSentToMe = msgSender === theirId && msgReceiver === myId;
			const isForThisChat = isSentByMe || isSentToMe;

			console.log('  - Is for this chat?', isForThisChat, '(sentByMe:', isSentByMe, ', sentToMe:', isSentToMe, ')');


			if (isForThisChat) {
				console.log('✨ Adding message to UI');

				// Check if this is a received message (not sent by me)
				const isSentByMe = msgSender === myId;
				const isDuplicate = messages.some(m => m._id === message._id);

				console.log('  - Is sent by me?', isSentByMe);
				console.log('  - Is duplicate?', isDuplicate);

				// Show notification for NEW received messages only
				if (!isSentByMe && !isDuplicate) {
					const senderName = member?.prenom || member?.nom || 'Worker';
					console.log('  - Showing notification for message from:', senderName);
					showNotification(`📩 New message from ${senderName}`, 'received');
				}

				setMessages(prev => {
					// Only check for duplicate _id (server-assigned)
					if (message._id && prev.some(m => m._id === message._id)) {
						console.log('⚠️ Duplicate message _id, skipping');
						return prev;
					}

					return [...prev, message];
				});
			} else {
				console.log('⏭️ Message belongs to another conversation, ignoring');
			}
		});

		socket.on('chatHistory', (history) => {
			console.log('📚 Chat history loaded:', history.length, 'messages');
			if (history.length > 0) {
				console.log('First message:', history[0]);
			}
			setMessages(history);
		});

		socket.on('connect_error', (err) => {
			console.error('❌ Socket connection error:', err.message);
		});

		socket.on('disconnect', (reason) => {
			console.log('🔌 Socket disconnected. Reason:', reason);
		});

		// Cleanup function
		return () => {
			console.log('🧹 Cleaning up socket connection...');
			if (socket.connected) {
				socket.disconnect();
			}
		};
	}, [id, currentUser]); // Re-run only when id or currentUser object changes

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (chatEndRef.current) {
			chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	const handleReservation = async (e) => {
		e.preventDefault();
		if (!currentUser) {
			alert('Please login to make a reservation');
			navigate('/login');
			return;
		}

		const payload = {
			...resData,
			clientId: currentUser._id,
			workerId: id
		};

		try {
			const res = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/reservations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				alert('Reservation successful!');
				setShowResModal(false);
			} else {
				alert('Failed to make reservation');
			}
		} catch (err) {
			console.error(err);
			alert('Error connecting to server');
		}
	};

	const handleSendMessage = (e) => {
		e.preventDefault();
		if (!newMessage.trim() || !currentUser) return;

		const messageData = {
			senderId: currentUser._id,
			receiverId: id,
			content: newMessage
		};

		socketRef.current.emit('sendMessage', messageData);
		showNotification('Message sent ✓', 'sent');
		setNewMessage('');
	};

	if (loading) {
		return (
			<div className="ptb-100 text-center">
				<div className="container">
					<p>Loading member details...</p>
				</div>
			</div>
		);
	}

	if (!member) {
		return (
			<div className="ptb-100 text-center">
				<div className="container">
					<p>Member not found.</p>
					<Link to="/team" className="main-btn"><span>Back to Team</span></Link>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="body-overlay"></div>

			<section className="page-banner-section bg-3">
				<div className="container">
					<div className="page-banner-content">
						<h2>Team Member Details</h2>
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								Team Details
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="team-details-section ptb-100">
				<div className="container">
					<div className="row">
						<div className="col-lg-4">
							<div className="team-details-img" style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
								<img src={member.imageUrl || "assets/images/team/tean-5.jpg"} alt={`${member.prenom} ${member.nom}`} style={{ width: '100%', height: 'auto' }} />
							</div>
						</div>

						<div className="col-lg-8">
							<div className="team-details-content">
								<span className="up-title" style={{ color: '#f55e1a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>{member.role} Profile</span>
								<h3>{member.prenom} {member.nom}</h3>
								<ul className="mb-4">
									<li><strong>Role:</strong> {member.role}</li>
									<li>
										<strong>About:</strong> {member.description || `Professional ${member.role} with extensive experience in the field. Committed to delivering high-quality results and ensuring client satisfaction through dedicated project management and technical expertise.`}
									</li>
									<li>
										<strong>Email:</strong> {member.email}
									</li>
									<li className="d-flex align-items-center gap-2">
										<span><strong>Follow:</strong></span>
										<div className="social-links d-inline-flex gap-2">
											<a href="#!"><i className="icofont-facebook"></i></a>
											<a href="#!"><i className="icofont-twitter"></i></a>
											<a href="#!"><i className="icofont-instagram"></i></a>
											<a href="#!"><i className="icofont-linkedin"></i></a>
										</div>
									</li>
								</ul>

								<div className="team-details-btns d-flex flex-wrap gap-3 mt-4">
									<button className="main-btn" onClick={() => setShowResModal(true)}>
										<span>
											Make a Reservation
											<i className="icofont-calendar ms-2"></i>
										</span>
									</button>
									<button className="main-btn" style={{ background: '#f55e1a', border: 'none' }} onClick={() => setShowChatModal(true)}>
										<span>
											Live Message
											<i className="icofont-chat ms-2"></i>
										</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Reservation Modal */}
			{showResModal && (
				<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
					<div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 5px 25px rgba(0,0,0,0.2)' }}>
						<div className="d-flex justify-content-between align-items-center mb-4">
							<h4 className="m-0">Book Reservation</h4>
							<button onClick={() => setShowResModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
						</div>
						<form onSubmit={handleReservation}>
							<div className="mb-3">
								<label className="form-label">Date</label>
								<input type="date" className="form-control" required onChange={e => setResData({ ...resData, date: e.target.value })} />
							</div>
							<div className="mb-3">
								<label className="form-label">Time</label>
								<input type="time" className="form-control" required onChange={e => setResData({ ...resData, time: e.target.value })} />
							</div>
							<div className="mb-3">
								<label className="form-label">Service Type</label>
								<select className="form-select" onChange={e => setResData({ ...resData, serviceType: e.target.value })}>
									<option>Consultation</option>
									<option>Direct Work</option>
									<option>Project Inspection</option>
								</select>
							</div>
							<div className="mb-4">
								<label className="form-label">Notes</label>
								<textarea className="form-control" rows="3" onChange={e => setResData({ ...resData, notes: e.target.value })}></textarea>
							</div>
							<button type="submit" className="main-btn w-100 border-0"><span>Confirm Booking</span></button>
						</form>
					</div>
				</div>
			)}

			{/* Chat Modal */}
			{showChatModal && (
				<div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '350px', height: '500px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 5px 35px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
					<div style={{ padding: '15px', background: '#f55e1a', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div className="d-flex align-items-center gap-2">
							<div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
								<i className="icofont-user"></i>
							</div>
							<h6 className="m-0">{member.prenom} {member.nom}</h6>
						</div>
						<button onClick={() => setShowChatModal(false)} style={{ border: 'none', background: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
					</div>

					{/* Notification Toast */}
					{notification.show && (
						<div style={{
							position: 'absolute',
							top: '60px',
							left: '50%',
							transform: 'translateX(-50%)',
							backgroundColor: notification.type === 'sent' ? '#4CAF50' : '#2196F3',
							color: 'white',
							padding: '10px 20px',
							borderRadius: '8px',
							boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
							zIndex: 10000,
							fontSize: '14px',
							fontWeight: '500',
							animation: 'slideDown 0.3s ease-out',
							display: 'flex',
							alignItems: 'center',
							gap: '8px'
						}}>
							<span>{notification.type === 'sent' ? '✓' : '📩'}</span>
							{notification.message}
						</div>
					)}

					<div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
						{messages.map((msg, idx) => (
							<div key={idx} style={{ textAlign: String(msg.senderId) === String(currentUser?._id) ? 'right' : 'left', marginBottom: '10px' }}>
								<div style={{
									display: 'inline-block',
									padding: '8px 12px',
									borderRadius: '12px',
									backgroundColor: String(msg.senderId) === String(currentUser?._id) ? '#f55e1a' : 'white',
									color: String(msg.senderId) === String(currentUser?._id) ? 'white' : '#333',
									boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
									maxWidth: '80%'
								}}>
									{msg.content}
								</div>
							</div>
						))}
						<div ref={chatEndRef} />
					</div>

					<form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid #eee' }}>
						<div className="input-group">
							<input
								type="text"
								className="form-control"
								placeholder="Type a message..."
								value={newMessage}
								onChange={e => setNewMessage(e.target.value)}
							/>
							<button className="btn btn-primary" type="submit" style={{ background: '#f55e1a', border: 'none' }}>
								<i className="icofont-paper-plane"></i>
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Static decorative content follows */}
			<section className="video-section ptb-100">
				<div className="container">
					<div className="row align-items-center">
						<div className="col-lg-6">
							<div className="video-content wow fadeInLeft delay-0-2s">
								<span className="up-title">Our Expertise</span>
								<h2>We Build Excellence With Our Experienced Team</h2>
								<p>Our team members are carefully selected for their expertise and dedication. We ensure every project is handled by specialists who understand the intricate details of construction and design.</p>

								<button className="main-btn" type="button">
									<span>
										Get a Case Study
										<i className="icofont-arrow-right"></i>
									</span>
								</button>
							</div>
						</div>

						<div className="col-lg-6">
							<div className="text-center wow fadeInRight delay-0-2s">
								<div className="video-btn">
									<a href="https://www.youtube.com/watch?v=qEp9p85TFHM" className="popup-youtube" target="_blank" rel="noreferrer">
										<span></span>
										<span></span>
										<span></span>
										<span></span>
										<i className="icofont-play-alt-2"></i>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}

export default TeamDetail;
;
