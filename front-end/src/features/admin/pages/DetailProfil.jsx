import React from 'react'

function DetailProfil() {
    return (
        <div>

            <section className="home-section">
                <div className="dashbord-body AddNewStaff-body">
                    <div className="row">
                        <div className="col-xxl-3 col-xl-3 col-lg-3">
                            <div className="Quotation-chart-box p-0 side-menu2">
                                <div className="card-main border-0">
                                    <div>
                                        <img className="staff-bg" id="staff-bg" src="/assets/images/home-img/staff-bg1.jpg"
                                            alt="staff-bg1" />
                                    </div>
                                    <div className="card-main-sub">
                                        <div className="View-profile-staff-main">
                                            <img className="profile-staff" src="/assets/images/home-img/profile-staff1.png"
                                                alt="profile-staff1" />
                                        </div>
                                        <div className="form-flex-profile">
                                            <div className="form-flex-sub">
                                                <p>Full Name:</p>
                                                <input type="text" placeholder="Enter full name" name="firstName" required=""
                                                    autocomplete="off" value="Darlene salimazizmaramayoub" />
                                            </div>
                                            <div className="form-flex-sub">
                                                <p>Email:</p>
                                                <input type="email" placeholder="Enter email address" name="lastName"
                                                    required="" autocomplete="off" value="salim@proquote.com" />
                                            </div>
                                            <div className="form-flex-sub">
                                                <p>Phone:</p>
                                                <input type="text" placeholder="Enter phone number" name="phone" required=""
                                                    autocomplete="off" value="+1 234 567 8899" />
                                            </div>
                                            <div className="form-flex-sub">
                                                <p>Department:</p>
                                                <input type="email" placeholder="Enter email address" name="lastName"
                                                    required="" autocomplete="off" value="Roof Replace" />
                                            </div>
                                            <div className="form-flex-sub">
                                                <p>Designation:</p>
                                                <input type="text" placeholder="Enter phone number" name="phone" required=""
                                                    autocomplete="off" value="Inspection" />
                                            </div>
                                            <div className="form-flex-sub">
                                                <p>Language:</p>
                                                <input type="text" placeholder="Enter phone number" name="phone" required=""
                                                    autocomplete="off" value="English" />
                                            </div>
                                            <div className="form-flex-sub">
                                                <p>Description</p>
                                                <textarea placeholder="Write description..." name="Description"
                                                    autocomplete="off" id="Description-text"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-9 col-xl-9 col-lg-9">
                            <div className="Quotation-chart-box h-auto">
                                <h2 className="new-profile" id="new-profile">Profile
                                    <button id="menu-toggle" className="menu-toggle-button">
                                        <img className="hamburger" id="hamburger-1" src="/assets/images/svg/layout-grid.svg"
                                            alt="side-menu" />
                                        <img className="close-icon" src="/assets/images/svg/add.svg" alt="x" />
                                    </button>
                                </h2>
                                <div className="profile-div-main pb-0">
                                    <p className="profilePhotoText">Profile Photo:</p>
                                    <div className="profile-edit-img-sub">
                                        <img src="/assets/images/home-img/profile-staff1.png" alt="profile-img-demo"
                                            className="profile-pic profile-pic-profile" />
                                    </div>
                                    <div className="image-input">
                                        <input type="file" accept="image/*" id="profileImageInput" className="file-upload" />
                                        <div className="upload-button" data-target="#profileImageInput">
                                            <img src="/assets/images/svg/add.svg" alt="add" />Upload Photo
                                        </div>
                                    </div>
                                </div>
                                <div className="profile-div-main">
                                    <p className="profilePhotoText">BG Photo:</p>
                                    <div className="profile-edit-img-sub profile-edit-img-sub2">
                                        <img src="/assets/images/home-img/staff-bg1.jpg" alt="profile-img-demo"
                                            className="profile-pic profile-pic-bg" />
                                    </div>
                                    <div className="image-input">
                                        <input type="file" accept="image/*" id="bgImageInput" className="file-upload" />
                                        <div className="upload-button" data-target="#bgImageInput">
                                            <img src="/assets/images/svg/add.svg" alt="add" />Upload Photo
                                        </div>
                                    </div>
                                </div>
                                <div className="form-flex">
                                    <div className="form-flex-sub">
                                        <p>Full Name*</p>
                                        <input type="text" placeholder="Enter full name" name="firstName" id="firstName"
                                            required="" autocomplete="off" value="Darlene salimazizmaramayoub" />
                                    </div>
                                    <div className="form-flex-sub">
                                        <p>Email*</p>
                                        <input type="email" placeholder="Enter email address" name="lastName" id="lastName"
                                            required="" autocomplete="off" value="salimazizmaramayoub@proquote.com" />
                                    </div>
                                    <div className="form-flex-sub">
                                        <p>Phone*</p>
                                        <input type="text" placeholder="Enter phone number" name="phone" id="phone" required=""
                                            autocomplete="off" value="+1 234 567 8899" />
                                    </div>
                                </div>
                                <div className="form-flex">
                                    <div className="form-flex-sub">
                                        <p>Department*</p>
                                        <input type="text" placeholder="Enter Department Type" name="Department" required=""
                                            autocomplete="off" value="Roof Replace" />
                                    </div>
                                    <div className="form-flex-sub">
                                        <p>Designation*</p>
                                        <input type="text" placeholder="Enter Designation Type" name="Designation" required=""
                                            autocomplete="off" value="Inspection" />
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
                                <div className="form-flex-sub mb-0">
                                    <p>Description</p>
                                    <textarea placeholder="Write description..." name="Description"
                                        autocomplete="off"></textarea>
                                </div>
                                <div className="add-staff-page-btn-main">
                                    <button className="add-staff-page-btn save-btn">Update</button>
                                    <button className="add-staff-page-btn cancel-btn">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

        </div>
    )
}


export default DetailProfil

