import React from 'react'

function Profile() {
    return (
        <div>



            <section className="home-section">
                <div className="dashbord-body AddNewStaff-body">
                    <div className="Quotation-chart-box h-auto">
                        <h2 className="new-profile">My Profile</h2>
                        <div className="profile-div-main pb-0" id="my-profile">
                            <p className="profilePhotoText">Profile Photo:</p>
                            <div className="profile-edit-img-sub">
                                <img src="/assets/images/home-img/profile-personal.png" alt="profile-img-demo"
                                    className="profile-pic profile-pic-profile" />
                            </div>
                            <div className="image-input">
                                <input type="file" accept="image/*" id="profileImageInput" className="file-upload" />
                                <div className="upload-button" data-target="#profileImageInput">
                                    <img src="/assets/images/svg/add.svg" alt="add" />Upload Photo
                                </div>
                            </div>
                        </div>
                        <div className="form-flex">
                            <div className="form-flex-sub">
                                <p>Full Name*</p>
                                <input type="text" placeholder="Enter full name" name="firstName" id="firstName" required=""
                                    autocomplete="off" />
                            </div>
                            <div className="form-flex-sub">
                                <p>Email*</p>
                                <input type="email" placeholder="Enter email address" name="lastName" id="lastName" required=""
                                    autocomplete="off" />
                            </div>
                            <div className="form-flex-sub">
                                <p>Phone*</p>
                                <input type="text" placeholder="Enter phone number" name="phone" id="phone" required=""
                                    autocomplete="off" />
                            </div>
                        </div>
                        <div className="form-flex">
                            <div className="form-flex-sub">
                                <p>Company Name*</p>
                                <input type="text" placeholder="Enter Department Type" name="Department" required=""
                                    autocomplete="off" value="ProQuote Roofing" />
                            </div>
                            <div className="form-flex-sub">
                                <p>Designation*</p>
                                <input type="text" placeholder="Enter Designation Type" name="Designation" required=""
                                    autocomplete="off" value="Owner" />
                            </div>
                            <div className="form-flex-sub">
                                <p>Language*</p>
                                <div className="dropdown ">
                                    <button className="dropdown-btn my-profile-dropdown">English</button>
                                    <div className="dropdown-content">
                                        <div className="dropdown-item">English</div>
                                        <div className="dropdown-item">Hindi</div>
                                        <div className="dropdown-item">Spanish</div>
                                        <div className="dropdown-item">French</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-flex">
                            <div className="form-flex-sub">
                                <p>Company Website*</p>
                                <input type="text" placeholder="Website URL" name="Department" required="" autocomplete="off" />
                            </div>
                            <div className="form-flex-sub">
                                <p>City*</p>
                                <div className="dropdown">
                                    <button className="dropdown-btn my-profile-dropdown">Select City</button>
                                    <div className="dropdown-content">
                                        <div className="dropdown-item">City One</div>
                                        <div className="dropdown-item">City Two</div>
                                        <div className="dropdown-item">City Three</div>
                                        <div className="dropdown-item">City Four</div>
                                    </div>
                                </div>
                            </div>
                            <div className="form-flex-sub">
                                <p>State*</p>
                                <div className="dropdown">
                                    <button className="dropdown-btn my-profile-dropdown">Select State</button>
                                    <div className="dropdown-content">
                                        <div className="dropdown-item">State One</div>
                                        <div className="dropdown-item">State Two</div>
                                        <div className="dropdown-item">State Three</div>
                                        <div className="dropdown-item">State Four</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-flex pb-0">
                            <div className="form-flex-sub">
                                <p>Company Address*</p>
                                <input type="text" placeholder="Enter your address" name="Language" required=""
                                    autocomplete="off" />
                            </div>
                            <div className="form-flex-sub">
                                <p>Area Code*</p>
                                <input type="text" placeholder="Enter area code" name="Language" required="" autocomplete="off" />
                            </div>
                        </div>
                        <div className="add-staff-page-btn-main">
                            <button className="add-staff-page-btn save-btn">Save</button>
                            <button className="add-staff-page-btn cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>

            </section>

        </div>
    )
}


export default Profile

