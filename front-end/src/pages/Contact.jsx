import React from 'react'

function Contact() {
  return (
    <div>
	<div class="contact-section ptb-100">
			<div class="container">
				<div class="contact-wrap">
					<div class="row">
						<div class="col-lg-6">
							<div class="contact-form ptb-100">
								<h2>We Are Always Ready To Solution Your All Problem.</h2>
								
								<form class="form-contact">
									<div class="row">
										<div class="col-lg-6">
											<div class="form-group">
												<input type="text" class="form-control" placeholder="Name"/>
											</div>
										</div>
										<div class="col-lg-6">
											<div class="form-group">
												<input type="email" class="form-control" placeholder="Email"/>
											</div>
										</div>
										<div class="col-lg-6">
											<div class="form-group">
												<input type="text" class="form-control" placeholder="Phone"/>
											</div>
										</div>
										<div class="col-lg-6">
											<div class="form-group">
												<input type="text" class="form-control" placeholder="Contact Subject"/>
											</div>
										</div>
										<div class="col-lg-12">
											<div class="form-group">
												<textarea cols="30" rows="10" class="form-control" placeholder="Message"></textarea>
											</div>
										</div>
										<div class="col-12">
											<button type="submit" class="main-btn">
												<span>Send Message</span>
											</button>
										</div>
									</div>
								</form>
							</div>
						</div>
	
						<div class="col-lg-6">
							<div class="contact-map">
								<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1570988.748074958!2d-103.23679093771068!3d39.70605489349627!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab584e432360b%3A0x1c3bb99243deb742!2sUnited%20States!5e0!3m2!1sen!2sbd!4v1649797290078!5m2!1sen!2sbd"></iframe>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

    </div>
  )
}

export default Contact
