import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
	return (
		<div>
			<section className="footer-section pt-100 pb-70">
				<div className="container">
					<div className="back-to-top text-center">
						<i className="icofont-simple-up"></i>
					</div>
					<div className="row">
						<div className="col-lg-3 col-sm-6">
							<div className="main-footer-item wow fadeInUp delay-0-2s">
								<Link to="/" className="footer-logo">
									<img src="/assets/images/bmp.png" alt="Company Logo" style={{ maxHeight: '80px', width: 'auto', borderRadius: '8px' }} />
								</Link>
								<p>Louasi architecto beatae vitae dicta sunt Nemo enim ipsam quia voluptas sit aut odit aut fugit this beatae vitae dicta Nemo enim ipsam to...</p>

								<ul className="footer-social-content">
									<li>
										<a href="#!" target="_blank" rel="noreferrer">
											<i className="icofont-facebook"></i>
										</a>
									</li>
									<li>
										<a href="#!" target="_blank" rel="noreferrer">
											<i className="icofont-youtube-play"></i>
										</a>
									</li>
									<li>
										<a href="#!" target="_blank" rel="noreferrer">
											<i className="icofont-linkedin"></i>
										</a>
									</li>
									<li>
										<a href="#!" target="_blank" rel="noreferrer">
											<i className="icofont-pinterest"></i>
										</a>
									</li>
								</ul>
							</div>
						</div>

						<div className="col-lg-3 col-sm-6">
							<div className="main-footer-item wow fadeInUp delay-0-4s">
								<h3>Service</h3>

								<ul className="import-link">
									<li>
										<Link to="/about">Why choose us</Link>
									</li>
									<li>
										<Link to="/project">Our solutions</Link>
									</li>
									<li>
										<Link to="/team">Partners</Link>
									</li>
									<li>
										<Link to="/about">Core values</Link>
									</li>
									<li>
										<Link to="/project">Our projects</Link>
									</li>
								</ul>
							</div>
						</div>

						<div className="col-lg-3 col-sm-6">
							<div className="main-footer-item wow fadeInUp delay-0-6s">
								<h3>Quick Link</h3>

								<ul className="import-link">
									<li>
										<Link to="/services">Residents</Link>
									</li>
									<li>
										<Link to="/project">Business</Link>
									</li>
									<li>
										<Link to="/services">Online Service</Link>
									</li>
									<li>
										<Link to="/about">Visiting</Link>
									</li>
									<li>
										<Link to="/team">Employment</Link>
									</li>
								</ul>
							</div>
						</div>

						<div className="col-lg-3 col-sm-6">
							<div className="main-footer-item wow fadeInUp delay-0-8s">
								<h3>Our Contact</h3>

								<ul className="contact-info">
									<li>
										<i className="icofont-clock-time"></i>
										<span>Open Hours of Government: Mon - Fri: 8.00 am. - 6.00 pm.</span>
									</li>
									<li>
										<i className="icofont-location-pin"></i>
										<span>13/A, Miranda Halim City. 2444/245 Halim City.</span>
									</li>
									<li>
										<i className="icofont-phone"></i>
										<a href="tel:+099-695-695-35">+099 695 695 35</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}

export default Footer;
