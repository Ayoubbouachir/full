import React, { useEffect, useState } from 'react'

function ProjectDetail() {
	const [project, setProject] = useState(null);
	const [engineer, setEngineer] = useState(null);
	const [activeImage, setActiveImage] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const id = params.get('id');
		if (id) {
			fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/Find/${id}`)
				.then(res => res.json())
				.then(data => {
					setProject(data);
					if (data.maquettes && data.maquettes.length > 0) {
						setActiveImage(data.maquettes[0]);
					}
					if (data.idUserEng) {
						fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/users/Find/${data.idUserEng}`)
							.then(res => res.json())
							.then(userData => setEngineer(userData))
							.catch(err => console.error("Error fetching engineer:", err));
					}
					setLoading(false);
				})
				.catch(err => {
					console.error(err);
					setLoading(false);
				});
		} else {
			setLoading(false);
		}
	}, []);
	return (
		<div>

			<div className="body-overlay"></div>

			<section className="page-banner-section bg-3">
				<div className="container">
					<div className="page-banner-content">
						<h2>{loading ? 'Loading...' : project ? project.nom : 'Project Not Found'}</h2>
						<ul>
							<li>
								<a href="index.html">Home</a>
							</li>
							<li>
								Project Details
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="project-details-section pt-100">
				<div className="container">
					<div className="row">
						<div className="col-lg-12">
							<div className="project-details-img" style={{ backgroundImage: `url(${activeImage || '/assets/images/projects/projects-1.jpg'})`, height: '500px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '15px', transition: 'background-image 0.5s ease-in-out' }}></div>
						</div>
					</div>

					<div className="project-details-cntent ptb-50">
						{loading ? (
							<p>Loading project details...</p>
						) : project ? (
							<>
								<div className="row">
									<div className="col-md-6">
										<p><strong>Type:</strong> <span className="badge bg-primary" style={{ padding: '8px 15px', borderRadius: '20px' }}>{project.type}</span></p>
										<p><strong>Cost:</strong> <span style={{ color: '#f55e1a', fontWeight: '700', fontSize: '1.2rem' }}>{project.cout} $</span></p>
										<p><strong>Workers:</strong> {project.nbArtisan} Artisans</p>
									</div>
									<div className="col-md-6">
										<p><strong>Start Date:</strong> {new Date(project.dateD).toLocaleDateString()}</p>
										<p><strong>End Date:</strong> {new Date(project.dateF).toLocaleDateString()}</p>
										<p><strong>Responsible Engineer:</strong> {engineer ? `${engineer.firstName} ${engineer.lastName}` : (project.idUserEng ? "Loading..." : "Not assigned")}</p>
									</div>
								</div>

								<div className="project-gallery" style={{ display: 'flex', gap: '15px', margin: '30px 0', flexWrap: 'wrap' }}>
									{project.maquettes && project.maquettes.length > 0 ? project.maquettes.map((url, idx) => (
										<div key={idx} className={`gallery-item ${activeImage === url ? 'active' : ''}`} 
											style={{ 
												overflow: 'hidden', 
												borderRadius: '12px', 
												boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
												border: activeImage === url ? '3px solid #f55e1a' : '3px solid transparent',
												transition: 'all 0.3s'
											}}>
											<img src={url} alt={`Maquette ${idx}`} 
												style={{ width: '200px', height: '140px', objectFit: 'cover', cursor: 'pointer' }} 
												onClick={() => setActiveImage(url)} />
										</div>
									)) : (
										<div className="alert alert-info w-100">No maquettes available for this project.</div>
									)}
								</div>

								<div className="description-box" style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', marginTop: '20px' }}>
									<h4 style={{ color: '#150f03', marginBottom: '15px' }}>Project Overview</h4>
									<p>This project, named <strong style={{color: '#f55e1a'}}>{project.nom}</strong>, is a professionally managed <strong style={{textTransform: 'capitalize'}}>{project.type}</strong> development. 
									Scheduled from <strong>{new Date(project.dateD).toLocaleDateString()}</strong> to <strong>{new Date(project.dateF).toLocaleDateString()}</strong>, 
									it represents a total investment of <strong>{project.cout} $</strong>.</p>
									<p>By leveraging a specialized team of <strong>{project.nbArtisan} experts</strong>, we ensure that every phase of the project meets international standards. 
									Our focus on quality construction and meticulous stategy ensures the best possible outcome for our clients.</p>
								</div>
							</>
						) : (
							<p className="text-center">Project details not found.</p>
						)}
					</div>
				</div>
			</section>

			<section className="counter-section pb-100">
				<div className="container">
					<div className="counter-wrap pt-100 pb-70">
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
				</div>
			</section>


		</div>
	)
}

export default ProjectDetail
