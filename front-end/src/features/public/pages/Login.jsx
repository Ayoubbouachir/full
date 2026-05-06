import React from 'react'
import { Link } from 'react-router-dom'

function Login() {
	return (
		<div>
			<section className="page-banner-section bg-6">
				<div className="container">
					<div className="page-banner-content">
						<h2>Sign In</h2>
						<ul>
							<li>
								<Link to="/">Home</Link>
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
							<div className="sign-up-form">
								<h2>Welcome Back Bonax</h2>
								<p>Fill your email and password to sign in.</p>

								<form className="form-wrap" onSubmit={(e) => e.preventDefault()}>
									<div className="form-floating form-group">
										<input type="email" className="form-control" id="emailAddress" placeholder="Your Email Address" defaultValue="" required />
										<label htmlFor="emailAddress" className="form-label">Your Email</label>
									</div>

									<div className="form-floating form-group">
										<input type="password" className="form-control" id="password-field1" placeholder="Your Password" defaultValue="" required />
										<label htmlFor="password-field1" className="form-label">Your Password</label>
										<span toggle="#password-field1" className="icofont-eye-alt field-icon toggle-password"></span>
									</div>

									<div className="submit-btn">
										<button type="submit" className="main-btn">
											<span className="btn-style">Sign In</span>
										</button>
									</div>

									<p className="already">
										<a href="#!">Forgot Password? <br /> </a>
										Don't have an account? <Link to="/registre">Sign Up</Link>
									</p>

									<span className="or">or</span>

									<ul className="footer-social-link">
										<li>
											<a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="hover-style">
												<span className="inner-border">
													<i className="icofont-facebook"></i>
												</span>
											</a>
										</li>
										<li>
											<a href="https://www.twitter.com/" target="_blank" rel="noreferrer" className="hover-style">
												<span className="inner-border">
													<i className="icofont-twitter"></i>
												</span>
											</a>
										</li>
										<li>
											<a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="hover-style">
												<span className="inner-border">
													<i className="icofont-linkedin"></i>
												</span>
											</a>
										</li>
										<li>
											<a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover-style">
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

export default Login;
