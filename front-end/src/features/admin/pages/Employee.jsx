import React, { useEffect, useState } from 'react'

function Employee() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3100/users/FindAll')
            .then(res => res.json())
            .then(data => {
                // Filter users with roles that count as staff (Worker, Engineer, Delivery, etc.)
                // For this page, we'll show everyone who is not a plain 'User' or 'Supplier' perhaps?
                // Or just show everyone for now and let the user filter.
                const staffRoles = ['Worker', 'Engineer', 'Delivery'];
                const filteredStaff = data.filter(user => staffRoles.includes(user.role));
                setStaff(filteredStaff);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);
    return (
        <div>
            <section className="home-section">

                <div className="dashbord-body">
                    <div className="Quotation-chart-box p-0">
                        <div className="controls-main controls-main-staff">
                            <div className="controls">
                                <div className="searchQuotation searchQuotation-staff">
                                    <img className="search-normal" src="/assets/images/svg/search-normal.svg" alt="search-normal" />
                                    <input type="text" placeholder="Search Staff" autocomplete="off" name="search" />
                                </div>
                                <div className="dropdown dropdown-asign dropdown-asign-staff">
                                    <button className="dropdown-btn assign2">Filter by Department</button>
                                    <div className="dropdown-content">
                                        <div className="dropdown-item">Roof Replace</div>
                                        <div className="dropdown-item">New Roof</div>
                                        <div className="dropdown-item">Roof Repair</div>
                                        <div className="dropdown-item">Roof Repair</div>
                                    </div>
                                </div>
                                <div className="dropdown dropdown-asign dropdown-asign-staff">
                                    <button className="dropdown-btn assign2">Filter by Designation</button>
                                    <div className="dropdown-content">
                                        <div className="dropdown-item">Inspection</div>
                                        <div className="dropdown-item">Inspection</div>
                                        <div className="dropdown-item">Inspection</div>
                                        <div className="dropdown-item">Final Quote Send</div>
                                    </div>
                                </div>
                            </div>
                            <div className="search-icons-main search-icons-main2 position-relative">
                                <a href="AddnewStaff.html">
                                    <div className="ComposeMail add-New-staff mb-0">
                                        <img className="sms-edit" src="/assets/images/svg/add.svg" alt="sms-edit" /> Add New Staff
                                    </div>
                                </a>
                                <img className="search-icons layout-grid2" src="/assets/images/svg/filter-search.svg"
                                    alt="filter-search" data-bs-toggle="modal" data-bs-target="#exampleModal" />
                            </div>
                        </div>
                    </div>
                    <div className="row staff-row">
                        {loading ? (
                            <div className="col-12 text-center mt-5">
                                <p>Loading staff data...</p>
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="col-12 text-center mt-5">
                                <p>No staff found.</p>
                            </div>
                        ) : (
                            staff.map((member) => (
                                <div key={member._id} className="col-xxl-3 col-xl-3 col-lg-6 col-card">
                                    <div className="card-main">
                                        <div className="position-relative">
                                            <img className="staff-bg" src={member.role === 'Engineer' ? "/assets/images/home-img/staff-bg3.jpg" : "/assets/images/home-img/staff-bg1.jpg"} alt="staff-bg" />
                                            <img className="more-white" src="/assets/images/svg/white-more.svg" alt="more" />
                                            <div className="short-popUp">
                                                <p>Edit</p>
                                                <p>Delete</p>
                                            </div>
                                        </div>
                                        <div className="card-main-sub">
                                            <div className="profile-staff-main">
                                                {member.imageUrl ? (
                                                    <img className="profile-staff" src={member.imageUrl} alt="profile" />
                                                ) : (
                                                    <div className="profile-staff" style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', height: '100px', width: '100px', margin: '0 auto' }}>
                                                        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{member.prenom.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="staff-name">{member.prenom} {member.nom}</p>
                                            <p className="staff-eamil">
                                                <a href={`mailto:${member.email}`}>{member.email}</a>
                                            </p>
                                            <div className="department-main">
                                                <div className="department-box department-box1">
                                                    <p className="roof-replace">{member.speciality || 'General'}</p>
                                                    <p className="department">Department</p>
                                                </div>
                                                <div className="department-box department-box2">
                                                    <p className="roof-replace">{member.role}</p>
                                                    <p className="department">Designation</p>
                                                </div>
                                            </div>
                                            <a href={`/admin/detailprofil?id=${member._id}`}>
                                                <div className="ComposeMail view-eye-btn mb-0">
                                                    <img className="sms-edit" src="/assets/images/svg/eye.svg" alt="sms-edit" /> View Profile
                                                </div>
                                            </a>
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

export default Employee
