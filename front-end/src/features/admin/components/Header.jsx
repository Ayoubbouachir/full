import React from 'react'
import { Link } from 'react-router-dom'

function Header() {
    return (
        <div>

            <div className="sidebar">
                <div className="logo-details">

                  
                    <img className="logo_name" src="/assets/images/bmp.png" alt="logo-text" style={{ maxWidth: '120px', height: 'auto', marginLeft: '10px' }} />

                </div>
                <ul className="nav-links">
                    <li>
                        <Link to="/admin/" className="active-menu">
                            <img className='side-menu-svg' src="/assets/images/svg/dashbord-svg.svg" alt="dashbord-svg" />
                            <span className="link_name">Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/quotations">
                            <img className='side-menu-svg' src="/assets/images/svg/receipt-item.svg" alt="receipt-item" />
                            <span className="link_name">All Quotation</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/calendar">
                            <img className='side-menu-svg' src="/assets/images/svg/calendar.svg" alt="calendar" />
                            <span className="link_name">Calendar</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/email">
                            <img className='side-menu-svg' src="/assets/images/svg/sms.svg" alt="calendar" />
                            <span className="link_name">Email</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/messages">
                            <img className='side-menu-svg' src="/assets/images/svg/sms.svg" alt="messages" />
                            <span className="link_name">Messages</span>
                        </Link>
                    </li>
                    <li className="inspection-main">
                        <div className="icon-link">
                            <Link to="/admin/employee" className="demomd">
                                <img className='side-menu-svg' src="/assets/images/svg/user-octagon.svg" alt="user-octagon" />
                                <span className="link_name">Employee</span>
                            </Link>
                        </div>
                    </li>
                    <li>
                        <Link to="/admin/terms">
                            <img className='side-menu-svg' src="/assets/images/svg/warning-2.svg" alt="warning-2" />
                            <span className="link_name">Terms & Conditions</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/profil">
                            <img className='side-menu-svg' src="/assets/images/svg/setting.svg" alt="setting" />
                            <span className="link_name">Profil</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/login">
                            <img className='side-menu-svg' src="/assets/images/svg/logOut.svg" alt="setting" />
                            <span className="link_name">Logout</span>
                        </Link>
                    </li>
                </ul>
            </div>

            <section className="home-section">
                <h1 className="d-none">hidden</h1>
                <h1 className="d-none">hidden</h1>
                <div className="home-content">
                    <img className='bx-menu' src="/assets/images/svg/menu.svg" alt="menu" />
                    <div className="search-main">
                        <img className="search-normal" src="/assets/images/svg/search-normal.svg" alt="search-normal" />
                        <input type="text" placeholder="Search" name="Search" />
                    </div>
                    <div className="notification-section">
                        <div className="notification-circle" id="messages-box">
                            <img src="/assets/images/svg/sms-notification.svg" alt="sms-notification" />
                        </div>
                        <div className="sms-box">
                            <p className="message-text">Message</p>
                            <div className="message-profile-main">
                                <div className="message-profile-sub">
                                    <img src="/assets/images/home-img/message-profile1.jpg" alt="message-profile1" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <div className="Cameron-main">
                                        <p className="Cameron"><a href="#">Cameron Williamson</a></p>
                                        <p className="Cameron-Time">10:13 PM</p>
                                    </div>
                                    <p className="incoming-message">Hello?</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="message-profile-sub">
                                    <img src="/assets/images/home-img/message-profile2.jpg" alt="message-profile1" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <div className="Cameron-main">
                                        <p className="Cameron"><a href="#">Ralph Edwards</a></p>
                                        <p className="Cameron-Time">02:13 PM</p>
                                    </div>
                                    <p className="incoming-message">Are you there? interested i this...</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="message-profile-sub">
                                    <img src="/assets/images/home-img/message-profile3.jpg" alt="message-profile1" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <div className="Cameron-main">
                                        <p className="Cameron"><a href="#">Eleanor Pena</a></p>
                                        <p className="Cameron-Time">11:13 PM</p>
                                    </div>
                                    <p className="incoming-message">Interested in this loads?</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="message-profile-sub">
                                    <img src="/assets/images/home-img/message-profile4.jpg" alt="message-profile1" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <div className="Cameron-main">
                                        <p className="Cameron"><a href="#">Jane Cooper</a></p>
                                        <p className="Cameron-Time">04:13 PM</p>
                                    </div>
                                    <p className="incoming-message">Okay...Do we have a deal?</p>
                                </div>
                            </div>
                            <div className="message-profile-main mb-0">
                                <div className="message-profile-sub">
                                    <img src="/assets/images/home-img/message-profile5.jpg" alt="message-profile1" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <div className="Cameron-main">
                                        <p className="Cameron"><a href="#">Williamson</a></p>
                                        <p className="Cameron-Time">02:13 PM</p>
                                    </div>
                                    <p className="incoming-message">Hello?</p>
                                </div>
                            </div>
                        </div>
                        <div className="notification-circle" id="notification-bing">
                            <img src="/assets/images/svg/notification-bing.svg" alt="notification-bing" />
                        </div>
                        <div className="sms-box" id="notification-bing-show">
                            <p className="message-text">Notifications</p>
                            <div className="message-profile-main">
                                <div className="message-profile-sub message-profile-sub1">
                                    <img className="keyframes" src="/assets/images/svg/keyframes.svg" alt="keyframes" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <p className="Cameron-Time">Morbi sapien massa, ultricies at rhoncus at, ullamcorper nec diam at
                                        rhoncus at, ullamcorper</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="message-profile-sub message-profile-sub1">
                                    <img className="keyframes" src="/assets/images/svg/keyframes.svg" alt="keyframes" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <p className="Cameron-Time">Morbi sapien massa, ultricies at rhoncus at, ullamcorper nec diam at
                                        rhoncus at, ullamcorper</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="message-profile-sub message-profile-sub1">
                                    <img className="keyframes" src="/assets/images/svg/keyframes.svg" alt="keyframes" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <p className="Cameron-Time">Morbi sapien massa, ultricies at rhoncus at, ullamcorper nec diam at
                                        rhoncus at, ullamcorper</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="message-profile-sub message-profile-sub1">
                                    <img className="keyframes" src="/assets/images/svg/keyframes.svg" alt="keyframes" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <p className="Cameron-Time">Order pending: ID 305830 Ultricies at rhoncus at ullamcorper</p>
                                </div>
                            </div>
                            <div className="message-profile-main mb-0">
                                <div className="message-profile-sub message-profile-sub1">
                                    <img className="keyframes" src="/assets/images/svg/keyframes.svg" alt="keyframes" />
                                </div>
                                <div className="Cameron-mian-head">
                                    <p className="Cameron-Time">Morbi sapien massa, ultricies at rhoncus at, ullamcorper nec diam at
                                        rhoncus at, ullamcorper</p>
                                </div>
                            </div>
                        </div>
                        <div className="notification-circle" 
                             onClick={() => {
                                 const current = document.documentElement.getAttribute('data-theme');
                                 const next = current === 'dark' ? 'light' : 'dark';
                                 document.documentElement.setAttribute('data-theme', next);
                                 localStorage.setItem('theme', next);
                                 window.location.reload();
                             }}
                             title="Toggle Theme"
                             style={{ cursor: 'pointer' }}>
                            <i className="icofont-moon" style={{ fontSize: '20px' }}></i>
                        </div>
                        <div className="notification-circle" 
                             onClick={() => window.dispatchEvent(new CustomEvent('toggle-magnifier'))}
                             title="Loupe"
                             style={{ cursor: 'pointer' }}>
                            <img src="/assets/images/svg/search-normal.svg" alt="magnifier" style={{ width: '20px' }} />
                        </div>
                        <div className="notification-circle" id="translate">
                            <img src="/assets/images/svg/translate.svg" alt="translate" />
                        </div>
                        <div className="sms-box" id="translate-show">
                            <p className="message-text">Language</p>
                            <div className="message-profile-main">
                                <div className="Cameron-mian-head">
                                    <p className="lang-text">English(UK)</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="Cameron-mian-head">
                                    <p className="lang-text">English(US)</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="Cameron-mian-head">
                                    <p className="lang-text">Hindi</p>
                                </div>
                            </div>
                            <div className="message-profile-main">
                                <div className="Cameron-mian-head">
                                    <p className="lang-text">Spanish</p>
                                </div>
                            </div>
                            <div className="message-profile-main mb-0">
                                <div className="Cameron-mian-head">
                                    <p className="lang-text">French</p>
                                </div>
                            </div>
                            <div className="message-profile-main mb-0">
                                <div className="Cameron-mian-head">
                                    <p className="lang-text">Arabic</p>
                                </div>
                            </div>
                        </div>
                        <Link to="/profile">
                            <div className="profile-img-main">
                                <img src="/assets/images/home-img/profile-img.png" alt="profile-img" />
                            </div>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}


export default Header

