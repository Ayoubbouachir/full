import React, { useState } from 'react'
import VoiceInput from '../components/VoiceInput';

function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	return (
		<div>

			<section className="page-banner-section bg-6">
				<div className="container">
					<div className="page-banner-content">
						<h2>Sign In</h2>
						<ul>
							<li>
								<a href="index.html">Home</a>
							</li>
							<li>
								Sign In
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="sign-up-section ptb-100">
				<div className="container">
					<div className="row">
						<div className="col-lg-6 col-md-6 pe-0">
							<div className="sign-up-img bg-2"></div>
						</div>

						<div className="col-lg-6 col-md-6 ps-0">
							<div class="sign-up-form">
								<h2>Welcome Back Bonax</h2>
								<p>Fill your email and password to sign in.</p>

								<form className="form-wrap">
									<div className="form-floating form-group">
										<input
											type="email"
											className="form-control"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
										<label for="emailAddress" className="form-label">Your Email</label>
									</div>

									<VoiceInput
										value={email}
										onChange={setEmail}
										fieldName="email"
									/>


									<div className="form-floating form-group">
										<input
											type={showPassword ? "text" : "password"}
											className="form-control"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
										/>
										<label for="password-field1" className="form-label">Your Password</label>
										<span
											className={`icofont-eye-${showPassword ? "blocked" : "alt"} field-icon toggle-password`}
											onClick={() => setShowPassword(!showPassword)}
											style={{ cursor: "pointer", zIndex: 10, position: "absolute", right: "20px", top: "25px" }}
										></span>
									</div>

									<VoiceInput
										value={password}
										onChange={setPassword}
										fieldName="password"
									/>

									<div className="submit-btn">
										<button type="submit" className="main-btn">
											<span className="btn-style">Sign In</span>
										</button>
									</div>

									<p className="already"> <a href="#">Forgot Password? <br /> </a> Don't have an account? <a href="registre">Sign Up</a></p>

									<span className="or">or</span>

									<ul className="footer-social-link">
										<li>
											<a href="https://www.facebook.com/" target="_blank" className="hover-style">
												<span className="inner-border">
													<i className="icofont-facebook"></i>
												</span>
											</a>
										</li>
										<li>
											<a href="https://www.twitter.com/" target="_blank" className="hover-style">
												<span className="inner-border">
													<i className="icofont-twitter"></i>
												</span>
											</a>
										</li>
										<li>
											<a href="https://www.linkedin.com/" target="_blank" className="hover-style">
												<span className="inner-border">
													<i className="icofont-linkedin"></i>
												</span>
											</a>
										</li>
										<li>
											<a href="https://www.instagram.com/" target="_blank" className="hover-style">
												<span className="inner-border">
													<i className="icofont-instagram"></i>
												</span>
											</a>
										</li>
									</ul>
								</form>
							</div>
						</div>
					</div>
				</div>
			</section>

		</div>
	)
}

export default Login
