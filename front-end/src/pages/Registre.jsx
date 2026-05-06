import React from 'react'

function Registre() {
  return (
    <div>

	<section class="page-banner-section bg-6">
			<div class="container">
				<div class="page-banner-content">
					<h2>Sign Up</h2>
					<ul>
						<li>
							<a href="index.html">Home</a>
						</li>
						<li>
							Sign Up
						</li>
					</ul>
				</div>
			</div>
		</section>

		<section class="sign-up-section ptb-100">
			<div class="container">
				<div class="row">
					<div class="col-lg-6 col-md-6 pe-0">
						<div class="sign-up-img"></div>
					</div>

					<div class="col-lg-6 col-md-6 ps-0">
						<div class="sign-up-form">
							<h2>Sign Up To Bonax</h2>
							<p>Registration takes less than a minute.</p>

							<form class="form-wrap">
								<div class="form-floating form-group">
									<input type="text" class="form-control" id="youName" placeholder="Your Name" value="" required=""/>
									<label for="youName" class="form-label">Your Email</label>
								</div>

								<div class="form-floating form-group">
									<input type="email" class="form-control" id="emailAddress" placeholder="Your Email Address" value="" required=""/>
									<label for="emailAddress" class="form-label">Your Email</label>
								</div>

								<div class="form-floating form-group">
									<input type="password" class="form-control" id="password-field1" placeholder="Your Password" value="" required=""/>
									<label for="password-field1" class="form-label">Your Password</label>
									<span toggle="#password-field1" class="icofont-eye-alt field-icon toggle-password"></span>
								</div>

								<div class="form-floating form-group">
									<input type="password" class="form-control" id="password-field" placeholder="Your Password" value="" required=""/>
									<label for="password-field" class="form-label">Your Confirm Password</label>
									<span toggle="#password-field" class="icofont-eye-alt field-icon toggle-password"></span>
								</div>

								<div class="submit-btn">
									<button type="submit" class="main-btn">
										<span>Sign Up</span>
									</button>
								</div>

								<p class="already">Already have an account? <a href="sign-in.html">Sign In</a></p>

								<span class="or">or</span>

								<ul class="footer-social-link">
									<li>
										<a href="https://www.facebook.com/" target="_blank" class="hover-style">
											<span class="inner-border">
												<i class="icofont-facebook"></i>
											</span>
										</a>
									</li>
									<li>
										<a href="https://www.twitter.com/" target="_blank" class="hover-style">
											<span class="inner-border">
												<i class="icofont-twitter"></i>
											</span>
										</a>
									</li>
									<li>
										<a href="https://www.linkedin.com/" target="_blank" class="hover-style">
											<span class="inner-border">
												<i class="icofont-linkedin"></i>
											</span>
										</a>
									</li>
									<li>
										<a href="https://www.instagram.com/" target="_blank" class="hover-style">
											<span class="inner-border">
												<i class="icofont-instagram"></i>
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

export default Registre
