import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Team() {
	const [teamMembers, setTeamMembers] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('http://localhost:3100/users/FindAll')
			.then(res => res.json())
			.then(data => {
				const filtered = data.filter(user =>
					user.role === 'Artisan' || user.role === 'Engineer'
				);
				setTeamMembers(filtered);
				setLoading(false);
			})
			.catch(err => {
				console.error("Error fetching team:", err);
				setLoading(false);
			});
	}, []);
	return (
		<div>
			<div className="body-overlay"></div>

			<section className="page-banner-section bg-4">
				<div className="container">
					<div className="page-banner-content">
						<h2>Team Page</h2>
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								Team
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="team-section ptb-100">
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
							<div className="col-12 text-center mt-5">
								<p>Loading team members...</p>
							</div>
						) : teamMembers.length === 0 ? (
							<div className="col-12 text-center mt-5">
								<p>No team members found.</p>
							</div>
						) : (
							teamMembers.map((member) => (
								<div key={member._id} className="col-lg-4 col-md-6">
									<div className="main-team-item fadeInUp delay-0-2s">
										<Link to={`/teamDetail?id=${member._id}`} className="team-img">
											<img src={member.imageUrl || "assets/images/team/tean-1.jpg"} alt={`${member.prenom} ${member.nom}`} />
										</Link>

										<div className="team-content hover-style wow">
											<div className="inner-border">
												<h3>
													<Link to={`/teamDetail?id=${member._id}`}>{member.prenom} {member.nom}</Link>
												</h3>
												<span>{member.role}</span>

												<div className="team-social-link">
													<Link to={`/teamDetail?id=${member._id}`} className="controller">
														<i className="icofont-arrow-right"></i>
													</Link>

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
		</div>
	)
}

export default Team;
