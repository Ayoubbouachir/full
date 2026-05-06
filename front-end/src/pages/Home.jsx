import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import RoleSection from '../components/RoleSection';

function Home() {
	const [projects, setProjects] = useState([]);
	const [team, setTeam] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [projectsRes, usersRes] = await Promise.all([
					fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/FindAll').then(res => res.json()),
					fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/users/FindAll').then(res => res.json())
				]);

				setProjects(projectsRes.slice(0, 6)); // Top 6 projects
				// Filter for team members (Workers and Engineers)
				const teamRoles = ['Artisan', 'Engineer'];
				setTeam(usersRes.filter(u => teamRoles.includes(u.role)).slice(0, 3));
			} catch (err) {
				console.error("Error fetching homepage data:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);
	return (
		<div>
			<RoleSection />
			<section className="banner-section bg-1">
				<div className="container">
					<div className="banner-content">
						<h1 className="wow fadeInUp delay-0-2s">We construction For Best service.</h1>
						<p className="wow fadeInUp delay-0-4s">Will give you a complete account of the system, and expound teachings of the great explorer of the truth,</p>

						<ul className="wow fadeInUp delay-0-6s">
							<li>
								<i className="icofont-tools-bag"></i>
								<h3>Improve Construcation</h3>
							</li>
							<li>
								<i className="icofont-gears"></i>
								<h3> Approach Construcation</h3>
							</li>
						</ul>

						<Link to="/contact" className="main-btn wow fadeInUp delay-0-8s">
							<span>
								Get a Quote
								<i className="icofont-arrow-right"></i>
							</span>
						</Link>
					</div>
				</div>
			</section>
			{/* === End Banner Section === */}

			{/* === Start Features Section === */}

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

			<section className="projects-section pt-100 pb-70">
				<div className="container">
					<div className="main-section-title-wrap">
						<div className="row">
							<div className="col-lg-6 wow fadeInLeft delay-0-2s">
								<div className="main-section-title left-title">
									<span className="up-title">Our Projects Now</span>
									<h2>We Have 37+ Years Of Experience Helped Succee</h2>
								</div>
							</div>
							<div className="col-lg-6 wow fadeInRight delay-0-2s">
								<p>Louasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam.</p>
							</div>
						</div>
					</div>

					<div className="row justify-content-center">
						{loading ? (
							<div className="col-12 text-center">
								<p>Loading projects...</p>
							</div>
						) : projects.length === 0 ? (
							<div className="col-12 text-center">
								<p>No projects found.</p>
							</div>
						) : (
							projects.map((project) => (
								<div key={project._id} className="col-lg-4 col-md-6">
									<div className="main-projects-item wow fadeInUp delay-0-2s">
										<Link to={`/projectDetail?id=${project._id}`} className="projects-img">
											<img src={project.maquetteUrl || "/assets/images/projects/projects-1.jpg"} alt={project.nom} />
										</Link>

										<div className="project-content hover-style">
											<div className="inner-border">
												<h3>
													<Link to={`/projectDetail?id=${project._id}`}>{project.nom}</Link>
												</h3>
												<p>{project.type}</p>
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
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
						{loading ? (
							<div className="col-12 text-center">
								<p>Loading team members...</p>
							</div>
						) : team.length === 0 ? (
							<div className="col-12 text-center">
								<p>No team members found.</p>
							</div>
						) : (
							team.map((member) => (
								<div key={member._id} className="col-lg-4 col-md-6">
									<div className="main-team-item fadeInUp delay-0-2s">
										<Link to={`/teamDetail?id=${member._id}`} className="team-img">
											<img src={member.imageUrl || "/assets/images/team/tean-1.jpg"} alt={member.prenom} />
										</Link>

										<div className="team-content hover-style wow">
											<div className="inner-border">
												<h3>
													<Link to={`/teamDetail?id=${member._id}`}>{member.prenom} {member.nom}</Link>
												</h3>
												<span>{member.role}</span>

												<div className="team-social-link">
													<button className="controller">
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
							))
						)}
					</div>
				</div>
			</section>

			<section className="testimonial-section ptb-100">
				<div className="container">
					<div className="main-section-title-wrap">
						<div className="row">
							<div className="col-lg-6 wow fadeInLeft delay-0-2s">
								<div className="main-section-title left-title">
									<span className="up-title">Our Testimonial</span>
									<h2>This Best Testimonial Membar Of Meting Helped Succee</h2>
								</div>
							</div>
							<div className="col-lg-6 wow fadeInRight delay-0-2s">
								<p>Louasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam.</p>
							</div>
						</div>
					</div>

					<div className="testimonial-slider owl-carousel owl-theme">
						<div className="main-testimonial-item">
							<img src="/assets/images/testimonial/testimonial-1.jpg" alt="Client testimonial 1" />
							<p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less this fsat normal distribution of to using 'Content here,</p>
							<h3>Juhon Dew</h3>
							<span>Founder</span>
							<ul>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
							</ul>
						</div>

						<div className="main-testimonial-item">
							<img src="/assets/images/testimonial/testimonial-2.jpg" alt="Client testimonial 2" />
							<p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less this fsat normal distribution of to using 'Content here,</p>
							<h3>Adam Dew</h3>
							<span>Founder</span>
							<ul>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
								<li>
									<i className="icofont-star"></i>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			<section className="video-section ptb-100">
				<div className="container">
					<div className="row align-items-center">
						<div className="col-lg-6">
							<div className="video-content wow fadeInLeft delay-0-2s">
								<span className="up-title">Our Watch Video</span>
								<h2>We Have Calculations This Man Helped Succeed Service!</h2>
								<p>Louasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores...</p>

								<button className="main-btn">
									<span>
										Get a Quote
										<i className="icofont-arrow-right"></i>
									</span>
								</button>
							</div>
						</div>

						<div className="col-lg-6">
							<div className="text-center wow fadeInRight delay-0-2s">
								<div className="video-btn">
									<a href="https://www.youtube.com/watch?v=qEp9p85TFHM" target="_blank" rel="noreferrer" className="popup-youtube">
										<span></span>
										<span></span>
										<span></span>
										<span></span>
										<i className="icofont-play-alt-2"></i>
									</a>
								</div>
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

					<div className="row justify-content-center">
						<div className="col-lg-4 col-md-6">
							<div className="main-blog-item wow fadeInUp delay-0-2s">
								<Link to="#!" className="blog-img">
									<img src="/assets/images/blog/blog-1.jpg" alt="Blog post about building presentation" />
								</Link>

								<div className="blog-content hover-style">
									<div className="inner-border">
										<ul>
											<li>April 12, 2020</li>
											<li>
												<Link to="#!">Comments (03)</Link>
											</li>
										</ul>
										<h3>
											<Link to="#!">Presentation Buldint of Bulding Avoid Construcation Blog.</Link>
										</h3>
										<p>Louasi architecto beatae vitae dicta sunt Nemo enim ipsam quia voluptas sit aut odit aut fugit this to...</p>
										<Link to="#!" className="main-detail-btn">
											Read More
											<i className="icofont-plus"></i>
										</Link>
									</div>
								</div>
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-blog-item wow fadeInUp delay-0-4s">
								<Link to="#!" className="blog-img">
									<img src="/assets/images/blog/blog-2.jpg" alt="Blog post about construction site" />
								</Link>

								<div className="blog-content hover-style">
									<div className="inner-border">
										<ul>
											<li>April 12, 2020</li>
											<li>
												<Link to="#!">Comments (03)</Link>
											</li>
										</ul>
										<h3>
											<Link to="#!">Presentation Buldint of Bulding Avoid Construcation Blog.</Link>
										</h3>
										<p>Louasi architecto beatae vitae dicta sunt Nemo enim ipsam quia voluptas sit aut odit aut fugit this to...</p>
										<Link to="#!" className="main-detail-btn">
											Read More
											<i className="icofont-plus"></i>
										</Link>
									</div>
								</div>
							</div>
						</div>

						<div className="col-lg-4 col-md-6">
							<div className="main-blog-item wow fadeInUp delay-0-6s">
								<Link to="#!" className="blog-img">
									<img src="/assets/images/blog/blog-3.jpg" alt="Blog post about modern architecture" />
								</Link>

								<div className="blog-content hover-style">
									<div className="inner-border">
										<ul>
											<li>April 12, 2020</li>
											<li>
												<Link to="#!">Comments (03)</Link>
											</li>
										</ul>
										<h3>
											<Link to="#!">Presentation Buldint of Bulding Avoid Construcation Blog.</Link>
										</h3>
										<p>Louasi architecto beatae vitae dicta sunt Nemo enim ipsam quia voluptas sit aut odit aut fugit this to...</p>
										<Link to="#!" className="main-detail-btn">
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

export default Home;
