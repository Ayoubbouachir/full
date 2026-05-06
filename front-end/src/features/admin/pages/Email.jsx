import React from 'react'

function Email() {
    return (
        <div>

            <section className="home-section">

                <div className="dashbord-body">
                    <div className="row">
                        <div className="col-xxl-3 col-xl-3 col-lg-3">
                            <div className="Quotation-chart-box Quotation-chart-box-email side-menu2">
                                <a href="#">
                                    <div className="ComposeMail">
                                        <img className="sms-edit" src="/assets/images/svg/sms-edit.svg" alt="sms-edit" /> Compose Mail
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/inbox.svg" alt="inbox" /> Inbox
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/snooze.svg" alt="snooze" /> Snooze
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/important.svg" alt="important" /> Important
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/sent.svg" alt="sent" /> Sent
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/draft.svg" alt="draft" /> Draft
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/allmail.svg" alt="allmail" /> All Mail
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/spam.svg" alt="spam" /> Spam
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/trash.svg" alt="trash" /> Trash
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/archive.svg" alt="archive" /> Archive
                                    </div>
                                </a>
                                <a href="#" className="ComposeMail-Inbox-main">
                                    <div className="ComposeMail-Inbox">
                                        <img className="sms-edit" src="/assets/images/svg/starred.svg" alt="starred" /> Starred
                                    </div>
                                </a>
                                <h2 className="tags-text">Tags</h2>
                                <div className="box-colors-main">
                                    <div className="box-colors" id="box-colors1"></div>
                                    <p><a href="#">New Quotation</a></p>
                                </div>
                                <div className="box-colors-main">
                                    <div className="box-colors" id="box-colors2"></div>
                                    <p><a href="#">Inspection Done</a></p>
                                </div>
                                <div className="box-colors-main">
                                    <div className="box-colors" id="box-colors3"></div>
                                    <p><a href="#">Final Quote Send</a></p>
                                </div>
                                <div className="box-colors-main mb-0">
                                    <div className="box-colors" id="box-colors4"></div>
                                    <p><a href="#">Order Confirm</a></p>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-9 col-xl-9 col-lg-9">
                            <div className="Quotation-chart-box p-0">
                                <div className="email-header">
                                    <div className="email-header-box">
                                        <div className="remember">
                                            <input type="checkbox" name="check" />
                                            <img src="/assets/images/svg/arrow-down.svg" alt="arrow-down"
                                                className="dropdown-btn-email" />
                                            <ul className="dropdown-list-email p-0">
                                                <li>All</li>
                                                <li>None</li>
                                                <li>Read</li>
                                                <li>Unread</li>
                                                <li>Starred</li>
                                                <li>Unstarred</li>
                                            </ul>
                                        </div>
                                        <a href="#">
                                            <img className="rotate-right" src="/assets/images/svg/rotate-right.svg"
                                                alt="rotate-right" />
                                        </a>
                                        <div className="position-relative">
                                            <img className="rotate-right more-mess" src="/assets/images/svg/more.svg" alt="more" />
                                            <div className="more-show">
                                                <img src="/assets/images/svg/mail-opened.svg" alt="mail-opened" /> Mark all as read
                                            </div>
                                        </div>
                                        <div className="searchQuotation searchQuotation-email">
                                            <img className="search-normal" src="/assets/images/svg/search-normal.svg"
                                                alt="search-normal" />
                                            <input type="text" placeholder="Search Mail" autocomplete="off" name="search" />
                                        </div>
                                    </div>
                                    <div className="email-header-box3">
                                        <p className="email-pagination">10 of 236</p>
                                        <button className="pagination-btn pagination-btn-email">
                                            <img src="/assets/images/svg/arrow-left.svg" alt="arrow-left" />
                                        </button>
                                        <button className="pagination-btn pagination-btn-email">
                                            <img src="/assets/images/svg/arrow-right2.svg" alt="arrow-right2" />
                                        </button>
                                        <button id="menu-toggle" className="menu-toggle-button">
                                            <img className="hamburger" id="hamburger-1" src="/assets/images/svg/layout-grid.svg"
                                                alt="side-menu" />
                                            <img className="close-icon" src="/assets/images/svg/add.svg" alt="x" />
                                        </button>
                                    </div>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Marshall Nichols</p>
                                    </div>

                                    <div>
                                        <p className="nichols2">Schedule Adjustment Request:
                                            <span> If you are going to use a passage of Lorem Ipsum, you need to be sure there
                                                isn’t anything embarrassing
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 28</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Isabella Carter</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Invitation to Industry Webinar:
                                            <span> Greetings, I invite you to join an industry webinar this friday. Your
                                                participate earliest convenience.
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 22</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Mason Wallace</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Budget Approval Pending:
                                            <span> Team, our budget proposal is pending approval. Please review the final draft
                                                attached and do tomorrow’s meeting.
                                            </span>
                                        </p>
                                        <div className="file-message">
                                            <img src="/assets/images/svg/img-svg.svg" alt="img-svg" /> image.jpeg
                                        </div>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Leo Phillips</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Project Update Meeting:
                                            <span> Hello Team, Let’s convene for a project update meeting on Thursday at 10 AM.
                                                Please come potential roadblocks.
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Logan Brooks</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Request for Collaboration:
                                            <span> Dear ProQuote, I am reaching out to explore opportunities between our
                                                available for a brief discussion next week?
                                            </span>
                                        </p>
                                        <div className="file-message">
                                            <img src="/assets/images/svg/pdfsvg.svg" alt="pdfsvg" /> partnership.pdf
                                        </div>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Owen Foster</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Schedule Adjustment Request:
                                            <span> Good day. this is to confirm the successful submission of our proposal for
                                                the upcoming client presentation.
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Amelia Turner</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Quarterly Report Review:
                                            <span>Dear Team, kindly review the attached quarterly report before our meeting at 2
                                                PM tomorrow. Your insights are appreciated.
                                            </span>
                                        </p>
                                        <div className="file-message">
                                            <img src="/assets/images/svg/img-svg.svg" alt="img-svg" /> image.jpeg
                                        </div>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Leo Phillips</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Project Update Meeting:
                                            <span> Hello Team, Let’s convene for a project update meeting on Thursday at 10 AM.
                                                Please come potential roadblocks.
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Liam Parker</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Send Final Quote:
                                            <span>Good day, this is to confirm the successful submission of our proposal for the
                                                upcoming client presentation. Await further instructions.
                                            </span>
                                        </p>
                                        <div className="file-message">
                                            <img src="/assets/images/svg/pdfsvg.svg" alt="img-svg" /> liamroofquote.pdf
                                        </div>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Leo Phillips</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Project Update Meeting:
                                            <span> Hello Team, Let’s convene for a project update meeting on Thursday at 10 AM.
                                                Please come potential roadblocks.
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Marshall Nichols</p>
                                    </div>

                                    <div>
                                        <p className="nichols2">Schedule Adjustment Request:
                                            <span> If you are going to use a passage of Lorem Ipsum, you need to be sure there
                                                isn’t anything embarrassing
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 28</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Logan Brooks</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Request for Collaboration:
                                            <span> Dear ProQuote, I am reaching out to explore opportunities between our
                                                available for a brief discussion next week?
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Marshall Nichols</p>
                                    </div>

                                    <div>
                                        <p className="nichols2">Schedule Adjustment Request:
                                            <span> If you are going to use a passage of Lorem Ipsum, you need to be sure there
                                                isn’t anything embarrassing
                                            </span>
                                        </p>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 28</p>
                                </div>
                                <div className="email-mail">
                                    <div className="checkbox-star">
                                        <div className="remember remember2">
                                            <input type="checkbox" name="check" />
                                        </div>
                                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M13.7299 3.51001L15.4899 7.03001C15.7299 7.52002 16.3699 7.99001 16.9099 8.08001L20.0999 8.61001C22.1399 8.95001 22.6199 10.43 21.1499 11.89L18.6699 14.37C18.2499 14.79 18.0199 15.6 18.1499 16.18L18.8599 19.25C19.4199 21.68 18.1299 22.62 15.9799 21.35L12.9899 19.58C12.4499 19.26 11.5599 19.26 11.0099 19.58L8.01991 21.35C5.87991 22.62 4.57991 21.67 5.13991 19.25L5.84991 16.18C5.97991 15.6 5.74991 14.79 5.32991 14.37L2.84991 11.89C1.38991 10.43 1.85991 8.95001 3.89991 8.61001L7.08991 8.08001C7.61991 7.99001 8.25991 7.52002 8.49991 7.03001L10.2599 3.51001C11.2199 1.60001 12.7799 1.60001 13.7299 3.51001Z"
                                                stroke="#707070" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        <p className="nichols">Mason Wallace</p>
                                    </div>
                                    <div>
                                        <p className="nichols2">Budget Approval Pending:
                                            <span> Team, our budget proposal is pending approval. Please review the final draft
                                                attached and do tomorrow’s meeting.
                                            </span>
                                        </p>
                                        <div className="file-message">
                                            <img src="/assets/images/svg/img-svg.svg" alt="img-svg" /> image.jpeg
                                        </div>
                                    </div>
                                    <div className="email-hover-box">
                                        <img src="/assets/images/svg/direct-inbox.svg" alt="direct-inbox" />
                                        <img src="/assets/images/svg/delete-box.svg" alt="delete-box" />
                                        <img src="/assets/images/svg/sms-notification2.svg" alt="sms-notification2" />
                                    </div>
                                    <p className="month-day">Oct 20</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

        </div>
    )
}

export default Email
