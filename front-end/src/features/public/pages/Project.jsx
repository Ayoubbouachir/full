import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Project() {
	const [projects, setProjects] = useState([]);
	const [filteredProjects, setFilteredProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		fetch('http://localhost:3100/projects/FindAll')
			.then(res => res.json())
			.then(data => {
				setProjects(data);
				setFilteredProjects(data);
				setLoading(false);
			})
			.catch(err => {
				console.error(err);
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		const result = projects.filter(p =>
			p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.type.toLowerCase().includes(searchTerm.toLowerCase())
		);
		setFilteredProjects(result);
	}, [searchTerm, projects]);

	return (
		<div>
			<div className="body-overlay"></div>

			<section className="page-banner-section bg-3">
				<div className="container">
					<div className="page-banner-content">
						<h2>Projects Page</h2>
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								Projects
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="projects-section ptb-100">
				<div className="container">
					<div className="main-section-title-wrap">
						<div className="row align-items-center">
							<div className="col-lg-6 wow fadeInLeft delay-0-2s">
								<div className="main-section-title left-title">
									<span className="up-title">Our Projects Now</span>
									<h2>{filteredProjects.length}+ Projects Successfully Completed</h2>
								</div>
							</div>
							<div className="col-lg-6 wow fadeInRight delay-0-2s">
								<div className="form-floating">
									<input
										type="text"
										className="form-control"
										id="searchProject"
										placeholder="Search projects..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
									<label htmlFor="searchProject" className="form-label">Search Projects (Name or Type)...</label>
								</div>
							</div>
						</div>
					</div>

					<div className="row justify-content-center">
						{loading ? (
							<div className="col-12 text-center mt-5">
								<p>Loading projects...</p>
							</div>
						) : filteredProjects.length === 0 ? (
							<div className="col-12 text-center mt-5">
								<p>No projects match your search.</p>
							</div>
						) : (
							filteredProjects.map((project) => (
								<div key={project._id} className="col-lg-4 col-md-6">
									<div className="main-projects-item wow fadeInUp delay-0-2s">
										<Link to={`/projectDetail?id=${project._id}`} className="projects-img">
											<img 
												src={
													(project.maquettes && project.maquettes.length > 0) ? project.maquettes[0] : 
													(project.maquetteUrl ? project.maquetteUrl : "/assets/images/projects/projects-1.jpg")
												} 
												alt={project.nom} 
											/>
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

						<nav>
							<ul className="pagination">
								<li className="page-item">
									<a href="#!" className="page-link">
										<i className="icofont-simple-left"></i>
									</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">1</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link active">2</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">3</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">4</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">
										<i className="icofont-simple-right"></i>
									</a>
								</li>
							</ul>
						</nav>
					</div>
				</div>
			</section>
		</div>
	)
}

export default Project;
