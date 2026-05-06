import React from 'react'

function Registre() {
    return (
        <div>

            <div className="login-main">
                <div className="row h-100 login-row">
                    <div className="col-xxl-6 col-xl-6 col-lg-6">
                        <div className="bg-login">
                            <a href="login.html"><img src="/assets/images/bmp.png" alt="logo" style={{ maxWidth: '150px', height: 'auto', marginBottom: '20px' }} /></a>
                            <p className="best-services">PROVIDE THE BEST SERVICES</p>
                            <h1 className="local">Trusted Local Roofing Services</h1>
                            <h2 className="offer-free">We offer free residential and commercial roof inspections and estimates. All
                                our work is guaranteed in writing.</h2>
                        </div>
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-8 form-login-col">
                        <div className="form-login">
                            <h2 className="welcome-text">Welcome To ProQuote</h2>
                            <p className="allows">Register page allows admin to enter login credentials for authentication and
                                access to secure content.</p>
                            <div className="button-link-main">
                                <a href="#" className="buttons-link">
                                    <img src="/assets/images/svg/google.svg" alt="google" />Sign in with Google
                                </a>
                                <a href="#" className="buttons-link">
                                    <img src="/assets/images/svg/apple.svg" alt="google" />Sign in with Apple
                                </a>
                            </div>
                            <div className="or-section">
                                <p>Register</p>
                            </div>

                            <div className="form-flex-sub form-flex-sub-login">
                                <p>Full Name*</p>
                                <input type="text" placeholder="Enter full name" name="firstName" required=""
                                    autocomplete="off" />
                            </div>
                            <div className="form-flex-sub form-flex-sub-login">
                                <p>Email*</p>
                                <input type="email" placeholder="Enter email address" name="lastName" required=""
                                    autocomplete="off" />
                            </div>
                            <div className="form-flex-sub form-flex-sub-login position-relative">
                                <p>Password*</p>
                                <input type="password" placeholder="Enter password" name="phone" required="" autocomplete="off" />
                                <img className="fa-eye fa-eye-slash" src="/assets/images/svg/eye-slash.svg" alt="eye-slash" id="eye" />
                            </div>
                            <a href="login" className="buttons-link account-create-btn">Create Account</a>
                            <p className="Already">Already have an account? <a href="login">Sign In</a></p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Registre
