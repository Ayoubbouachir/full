import React from 'react'
import { Link } from 'react-router-dom'

function About() {
	return (
		<div>
			<section className="page-banner-section bg-1">
				<div className="container">
					<div className="page-banner-content">
						<h2>Our Story</h2>
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								About
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="about-us-section about-style-form-mobile ptb-100">
				<div className="container">
					<div className="row align-items-center">
						<div className="col-lg-6">
							<div className="about-us-img me-15 wow fadeInLeft delay-0-2s">
								<img src="assets/images/about-img.jpg" alt="About our company" />

								<div className="experience">
									<div className="experience-bg">
										<span>37+ Experience</span>
									</div>
								</div>
							</div>
						</div>
						<div className="col-lg-6">
							<div className="about-content ms-15 wow fadeInRight delay-0-2s">
								<span className="up-title">Our Heritage</span>
								<h2>Over 37 Years of Engineering Excellence</h2>
								<p>With a legacy of precision and innovation, we have been shaping the architectural landscape since 1987. Our commitment to quality and client satisfaction has made us a leader in the construction industry.</p>
								<ul>
									<li>
										<i className="icofont-hand-drawn-right"></i>
										Quality Our Best of Equipment’s Construction.
									</li>
									<li>
										<i className="icofont-hand-drawn-right"></i>
										Expertise Great Innovation And  & Innovation.
									</li>
									<li>
										<i className="icofont-hand-drawn-right"></i>
										The Leading of Engineering Construcation.
									</li>
								</ul>
								<div className="progress-bars" data-percentage="72%">
									<h4 className="progress-title-holder">
										<span className="progress-title">Successful For Construction</span>
										<span className="progress-number-wrapper">
											<span className="progress-number-mark">
												<span className="percent"></span>
											</span>
										</span>
									</h4>

									<div className="progress-content-outter">
										<div className="progress-content"></div>
									</div>
								</div>

								<Link to="/contact" className="main-btn">
									<span>
										Get a Quote
										<i className="icofont-arrow-right"></i>
									</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="features-section pt-100 pb-70">
				<div className="container">
					<div className="row d-flex justify-content-between">
						<div className="col-lg-3 col-sm-6">
							<div className="main-features-item wow fadeInUp delay-0-2s">
								<i className="main-icon icofont-building-alt"></i>
								<i className="shape-icon icofont-building-alt"></i>
								<h3>Presentation Bulding</h3>
							</div>
						</div>

						<div className="col-lg-3 col-sm-6">
							<div className="main-features-item wow fadeInUp delay-0-4s">
								<i className="main-icon icofont-calculations"></i>
								<i className="shape-icon icofont-calculations"></i>
								<h3>Calculations Barar</h3>
							</div>
						</div>

						<div className="col-lg-3 col-sm-6">
							<div className="main-features-item wow fadeInUp delay-0-6s">
								<i className="main-icon icofont-industries"></i>
								<i className="shape-icon icofont-industries"></i>
								<h3>Industries Pollution</h3>
							</div>
						</div>

						<div className="col-lg-3 col-sm-6">
							<div className="main-features-item wow fadeInUp delay-0-8s">
								<i className="main-icon icofont-under-construction-alt"></i>
								<i className="shape-icon icofont-under-construction-alt"></i>
								<h3>Under-Construction</h3>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="services-section bg-2 bg-color-f7f8f9 pt-100 pb-70">
				<div className="container">
					<div className="main-section-title wow fadeInUp delay-0-2s">
						<span className="up-title">Our Best Services</span>
						<h2>We Have Best for Service Succeed Quality</h2>
					</div>

					<div className="row">
						<div className="col-lg-4 col-md-6">
							<div className="main-services-item style-two wow fadeInUp delay-0-2s">
								<i className="icofont-building-alt"></i>
								<h3>
									<Link to="#!">Presentation Bulding</Link>
								</h3>
								<p>Louasi architecto beatae vitae dicta su voluptatem quia the voluptas so sequuntur magni dolores.</p>

								<Link to="#!" className="main-detail-btn">
									<i className="icofont-plus"></i>
									Read More
								</Link>
								<img src="assets/images/services-card-shape-2.png" className="services-card-shape" alt="Service design shape" />
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-services-item style-two wow fadeInUp delay-0-4s">
								<i className="icofont-industries"></i>
								<h3>
									<Link to="#!">Industries Pollution</Link>
								</h3>
								<p>Louasi architecto beatae vitae dicta su voluptatem quia the voluptas so sequuntur magni dolores.</p>

								<Link to="#!" className="main-detail-btn">
									<i className="icofont-plus"></i>
									Read More
								</Link>
								<img src="assets/images/services-card-shape-2.png" className="services-card-shape" alt="Service design shape" />
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-services-item style-two wow fadeInUp delay-0-6s">
								<i className="icofont-under-construction-alt"></i>
								<h3>
									<Link to="#!">Under-Construction</Link>
								</h3>
								<p>Louasi architecto beatae vitae dicta su voluptatem quia the voluptas so sequuntur magni dolores.</p>

								<Link to="#!" className="main-detail-btn">
									<i className="icofont-plus"></i>
									Read More
								</Link>
								<img src="assets/images/services-card-shape-2.png" className="services-card-shape" alt="Service design shape" />
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-services-item style-two wow fadeInUp delay-0-2s">
								<i className="icofont-world"></i>
								<h3>
									<Link to="#!">Presentation Bulding</Link>
								</h3>
								<p>Louasi architecto beatae vitae dicta su voluptatem quia the voluptas so sequuntur magni dolores.</p>

								<Link to="#!" className="main-detail-btn">
									<i className="icofont-plus"></i>
									Read More
								</Link>
								<img src="assets/images/services-card-shape-2.png" className="services-card-shape" alt="Service design shape" />
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-services-item style-two wow fadeInUp delay-0-4s">
								<i className="icofont-dart"></i>
								<h3>
									<Link to="#!">Industries Pollution</Link>
								</h3>
								<p>Louasi architecto beatae vitae dicta su voluptatem quia the voluptas so sequuntur magni dolores.</p>

								<Link to="#!" className="main-detail-btn">
									<i className="icofont-plus"></i>
									Read More
								</Link>
								<img src="assets/images/services-card-shape-2.png" className="services-card-shape" alt="Service design shape" />
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-services-item style-two wow fadeInUp delay-0-6s">
								<i className="icofont-gears"></i>
								<h3>
									<Link to="#!">Under-Construction</Link>
								</h3>
								<p>Louasi architecto beatae vitae dicta su voluptatem quia the voluptas so sequuntur magni dolores.</p>

								<Link to="#!" className="main-detail-btn">
									<i className="icofont-plus"></i>
									Read More
								</Link>
								<img src="assets/images/services-card-shape-2.png" className="services-card-shape" alt="Service design shape" />
							</div>
						</div>
					</div>
				</div>

				<img src="assets/images/services-bg-shape.png" className="services-bg-shape" alt="Service background shape" />
			</section>

			<section className="team-section bg-1 bg-color-f2f3f5 pt-100 pb-70">
				<div className="container">
					<div className="main-section-title-wrap">
						<div className="row">
							<div className="col-lg-6 wow fadeInLeft delay-0-2s">
								<div className="main-section-title left-title">
									<span className="up-title">Our Team Membar</span>
									<h2>This Best Team Membar Of Meting Helped Succee</h2>
								</div>
							</div>
							<div className="col-lg-6 wow fadeInRight delay-0-2s">
								<p>Louasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam.</p>
							</div>
						</div>
					</div>

					<div className="row justify-content-center">
						<div className="col-lg-4 col-md-6">
							<div className="main-team-item wow fadeInUp delay-0-2s">
								<Link to="/team" className="team-img">
									<img src="assets/images/team/team-1.jpg" alt="Team member 1" />
								</Link>

								<div className="team-content hover-style">
									<div className="inner-border">
										<h3>
											<Link to="/team">Jhuhon Dew</Link>
										</h3>
										<span>Founder</span>

										<div className="team-social-link">
											<button className="controller" type="button">
												<i className="icofont-arrow-right"></i>
											</button>

											<ul className="social-link">
												<li>
													<a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
														<i className="icofont-facebook"></i>
													</a>
												</li>
												<li>
													<a href="https://www.twitter.com/" target="_blank" rel="noreferrer">
														<i className="icofont-twitter"></i>
													</a>
												</li>
												<li>
													<a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
														<i className="icofont-instagram"></i>
													</a>
												</li>
												<li>
													<a href="https://www.vimeo.com/" target="_blank" rel="noreferrer">
														<i className="icofont-vimeo"></i>
													</a>
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-team-item wow fadeInUp delay-0-4s">
								<Link to="/team" className="team-img">
									<img src="assets/images/team/team-2.jpg" alt="Team member 2" />
								</Link>

								<div className="team-content hover-style">
									<div className="inner-border">
										<h3>
											<Link to="/team">Kilvaz Smith</Link>
										</h3>
										<span>Marketer</span>

										<div className="team-social-link">
											<button className="controller" type="button">
												<i className="icofont-arrow-right"></i>
											</button>

											<ul className="social-link">
												<li>
													<a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
														<i className="icofont-facebook"></i>
													</a>
												</li>
												<li>
													<a href="https://www.twitter.com/" target="_blank" rel="noreferrer">
														<i className="icofont-twitter"></i>
													</a>
												</li>
												<li>
													<a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
														<i className="icofont-instagram"></i>
													</a>
												</li>
												<li>
													<a href="https://www.vimeo.com/" target="_blank" rel="noreferrer">
														<i className="icofont-vimeo"></i>
													</a>
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-team-item hover-style wow fadeInUp delay-0-6s">
								<Link to="/team" className="team-img">
									<img src="assets/images/team/team-3.jpg" alt="Team member 3" />
								</Link>

								<div className="team-content hover-style">
									<div className="inner-border">
										<h3>
											<Link to="/team">Admon Smith</Link>
										</h3>
										<span>Founder</span>

										<div className="team-social-link">
											<button className="controller" type="button">
												<i className="icofont-arrow-right"></i>
											</button>

											<ul className="social-link">
												<li>
													<a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
														<i className="icofont-facebook"></i>
													</a>
												</li>
												<li>
													<a href="https://www.twitter.com/" target="_blank" rel="noreferrer">
														<i className="icofont-twitter"></i>
													</a>
												</li>
												<li>
													<a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
														<i className="icofont-instagram"></i>
													</a>
												</li>
												<li>
													<a href="https://www.vimeo.com/" target="_blank" rel="noreferrer">
														<i className="icofont-vimeo"></i>
													</a>
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="counter-section counter-wrap pt-100 pb-70">
				<div className="container">
					<div className="row">
						<div className="col-lg-3 col-sm-6">
							<div className="main-counter-item wow fadeInUp delay-0-2s">
								<h2 className="counter">3567</h2>
								<h2 className="point">+</h2>
								<h3>PROJECT DON</h3>
							</div>
						</div>
						<div className="col-lg-3 col-sm-6">
							<div className="main-counter-item wow fadeInUp delay-0-4s">
								<h2 className="counter">547</h2>
								<h2 className="point">+</h2>
								<h3>HAPPY CLIENT</h3>
							</div>
						</div>
						<div className="col-lg-3 col-sm-6">
							<div className="main-counter-item wow fadeInUp delay-0-6s">
								<h2 className="counter">7067</h2>
								<h2 className="point">+</h2>
								<h3>CLIENT SATISFIED</h3>
							</div>
						</div>
						<div className="col-lg-3 col-sm-6">
							<div className="main-counter-item wow fadeInUp delay-0-8s">
								<h2 className="counter">3567</h2>
								<h2 className="point">+</h2>
								<h3>TRUSTED CLIENT</h3>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="blog-section pt-100 pb-70">
				<div className="container">
					<div className="main-section-title-wrap">
						<div className="row">
							<div className="col-lg-6 wow fadeInLeft delay-0-2s">
								<div className="main-section-title left-title">
									<span className="up-title">Our Largest Blog</span>
									<h2>This Best Largest Blog Membar Of Helped Succee</h2>
								</div>
							</div>
							<div className="col-lg-6 wow fadeInRight delay-0-2s">
								<p>Louasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam.</p>
							</div>
						</div>
					</div>

					<div className="row">
						<div className="col-lg-4 col-md-6">
							<div className="main-blog-item wow fadeInUp delay-0-2s">
								<Link to="/blog" className="blog-img">
									<img src="assets/images/blog/blog-1.jpg" alt="Blog post 1" />
								</Link>

								<div className="blog-content hover-style">
									<div className="inner-border">
										<ul>
											<li>April 12, 2020</li>
											<li>
												<Link to="/blog">Comments (03)</Link>
											</li>
										</ul>
										<h3>
											<Link to="/blog">Presentation Buldint of Bulding Avoid Construcation Blog.</Link>
										</h3>
										<p>Louasi architecto beatae vitae dicta sunt Nemo enim ipsam quia voluptas sit aut odit aut fugit this to...</p>
										<Link to="/blog" className="main-detail-btn">
											Read More
											<i className="icofont-plus"></i>
										</Link>
									</div>
								</div>
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-blog-item wow fadeInUp delay-0-4s">
								<Link to="/blog" className="blog-img">
									<img src="assets/images/blog/blog-2.jpg" alt="Blog post 2" />
								</Link>

								<div className="blog-content hover-style">
									<div className="inner-border">
										<ul>
											<li>April 12, 2020</li>
											<li>
												<Link to="/blog">Comments (03)</Link>
											</li>
										</ul>
										<h3>
											<Link to="/blog">Presentation Buldint of Bulding Avoid Construcation Blog.</Link>
										</h3>
										<p>Louasi architecto beatae vitae dicta sunt Nemo enim ipsam quia voluptas sit aut odit aut fugit this to...</p>
										<Link to="/blog" className="main-detail-btn">
											Read More
											<i className="icofont-plus"></i>
										</Link>
									</div>
								</div>
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-blog-item wow fadeInUp delay-0-6s">
								<Link to="/blog" className="blog-img">
									<img src="assets/images/blog/blog-3.jpg" alt="Blog post 3" />
								</Link>

								<div className="blog-content hover-style">
									<div className="inner-border">
										<ul>
											<li>April 12, 2020</li>
											<li>
												<Link to="/blog">Comments (03)</Link>
											</li>
										</ul>
										<h3>
											<Link to="/blog">Presentation Buldint of Bulding Avoid Construcation Blog.</Link>
										</h3>
										<p>Louasi architecto beatae vitae dicta sunt Nemo enim ipsam quia voluptas sit aut odit aut fugit this to...</p>
										<Link to="/blog" className="main-detail-btn">
											Read More
											<i className="icofont-plus"></i>
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

		</div>
	)
}

export default About;
