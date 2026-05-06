/*------------------------------------- Side Menu & DropDown -------------------------------------*/
const arrows = document.querySelectorAll(".demomd");
arrows.forEach((arrow) => {
    arrow.addEventListener("click", (e) => {
        const arrowParent = e.target.closest(".demomd").parentElement.parentElement;
        arrowParent.classList.toggle("showMenu");
    });
});

const sidebar = document.querySelector(".sidebar");
const sidebarBtn = document.querySelector(".bx-menu");

sidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

/*------------------------------------- Message Box Hide Show -------------------------------------*/
function showSmsBox() {
    var smsBox = document.querySelector('.sms-box');
    smsBox.classList.remove('hide');
    smsBox.classList.add('show');
}

function hideSmsBox() {
    var smsBox = document.querySelector('.sms-box');
    smsBox.classList.remove('show');
    smsBox.classList.add('hide');
    setTimeout(function () {
        smsBox.style.display = 'none';
    }, 500);
}

document.getElementById('messages-box').addEventListener('click', function (event) {
    var smsBox = document.querySelector('.sms-box');
    if (smsBox.style.display === 'none' || smsBox.style.display === '') {
        smsBox.style.display = 'block';
        showSmsBox();
    } else {
        hideSmsBox();
    }
});

document.addEventListener('click', function (event) {
    var smsBox = document.querySelector('.sms-box');
    var messagesBox = document.getElementById('messages-box');

    if (!smsBox.contains(event.target) && !messagesBox.contains(event.target)) {
        hideSmsBox();
    }
});

/*------------------------------------- Notification Box Hide Show -------------------------------------*/
function showNotificationBox() {
    var notificationBox = document.getElementById('notification-bing-show');
    notificationBox.style.display = 'block';
    notificationBox.style.opacity = '0';
    setTimeout(function () {
        notificationBox.style.opacity = '1';
        notificationBox.style.transition = 'opacity 0.5s ease-in-out';
    }, 10);
}

function hideNotificationBox() {
    var notificationBox = document.getElementById('notification-bing-show');
    notificationBox.style.opacity = '0';
    setTimeout(function () {
        notificationBox.style.display = 'none';
    }, 500);
}

document.getElementById('notification-bing').addEventListener('click', function (event) {
    var notificationBox = document.getElementById('notification-bing-show');
    if (notificationBox.style.display === 'none' || notificationBox.style.display === '') {
        showNotificationBox();
    } else {
        hideNotificationBox();
    }
});

document.addEventListener('click', function (event) {
    var notificationBox = document.getElementById('notification-bing-show');
    var notificationIcon = document.getElementById('notification-bing');

    if (!notificationBox.contains(event.target) && !notificationIcon.contains(event.target)) {
        hideNotificationBox();
    }
});

/*------------------------------------- Langauge Box Hide Show -------------------------------------*/
function showTranslateBox() {
    var translateBox = document.getElementById('translate-show');
    translateBox.style.display = 'block';
    translateBox.style.opacity = '0';
    setTimeout(function () {
        translateBox.style.opacity = '1';
        translateBox.style.transition = 'opacity 0.5s ease-in-out';
    }, 10);
}

function hideTranslateBox() {
    var translateBox = document.getElementById('translate-show');
    translateBox.style.opacity = '0';
    setTimeout(function () {
        translateBox.style.display = 'none';
    }, 500);
}

document.getElementById('translate').addEventListener('click', function (event) {
    var translateBox = document.getElementById('translate-show');
    if (translateBox.style.display === 'none' || translateBox.style.display === '') {
        showTranslateBox();
    } else {
        hideTranslateBox();
    }
});

document.addEventListener('click', function (event) {
    var translateBox = document.getElementById('translate-show');
    var translateIcon = document.getElementById('translate');

    if (!translateBox.contains(event.target) && !translateIcon.contains(event.target)) {
        hideTranslateBox();
    }
});

/*------------------------------------- PopUp calendar -------------------------------------*/
let calendar = document.querySelector('.calendar');

if (calendar) {
    let selectedDay = null;
    const month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    isLeapYear = (year) => {
        return (year % 4 === 0 && year % 100 !== 0 && year % 400 !== 0) || (year % 100 === 0 && year % 400 === 0);
    };

    getFebDays = (year) => {
        return isLeapYear(year) ? 29 : 28;
    };

    generateCalendar = (month, year) => {
        let calendar_days = calendar.querySelector('.calendar-days');
        let calendar_header_year = calendar.querySelector('#year');
        let days_of_month = [31, getFebDays(year), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        calendar_days.innerHTML = '';

        let currDate = new Date();
        if (!month) month = currDate.getMonth();
        if (!year) year = currDate.getFullYear();

        let curr_month = `${month_names[month]}`;
        month_picker.innerHTML = curr_month;
        calendar_header_year.innerHTML = year;

        let first_day = new Date(year, month, 1);

        for (let i = 0; i <= days_of_month[month] + first_day.getDay() - 1; i++) {
            let day = document.createElement('div');
            if (i >= first_day.getDay()) {
                day.classList.add('calendar-day-hover');
                day.innerHTML = i - first_day.getDay() + 1;
                day.innerHTML += `<span></span><span></span><span></span><span></span>`;

                if (i - first_day.getDay() + 1 === currDate.getDate() && year === currDate.getFullYear() && month === currDate.getMonth()) {
                    day.classList.add('curr-date');
                }
                day.addEventListener('click', function () {
                    if (selectedDay) {
                        selectedDay.classList.remove('selected-date');
                    }

                    selectedDay = day;
                    day.classList.add('selected-date');
                });
            }
            calendar_days.appendChild(day);
        }
    };

    let month_list = calendar.querySelector('.month-list');
    month_names.forEach((e, index) => {
        let month = document.createElement('div');
        month.innerHTML = `<div data-month="${index}">${e}</div>`;
        month.querySelector('div').onclick = () => {
            month_list.classList.remove('show');
            curr_month.value = index;
            generateCalendar(index, curr_year.value);
        };
        month_list.appendChild(month);
    });

    let month_picker = calendar.querySelector('#month-picker');
    month_picker.onclick = () => {
        month_list.classList.add('show');
    };

    let currDate = new Date();
    let curr_month = { value: currDate.getMonth() };
    let curr_year = { value: currDate.getFullYear() };

    generateCalendar(curr_month.value, curr_year.value);

    document.querySelector('#prev-year').onclick = () => {
        --curr_year.value;
        generateCalendar(curr_month.value, curr_year.value);
    };

    document.querySelector('#next-year').onclick = () => {
        ++curr_year.value;
        generateCalendar(curr_month.value, curr_year.value);
    };
}

/*------------------------------------- PopUp calendar Hide Show -------------------------------------*/
const calendarIcon = document.querySelector('.calender-show');
const calendar2 = document.querySelector('.calendar');
if (calendarIcon && calendar2) {
    calendarIcon.addEventListener('click', function () {
        calendar2.classList.toggle('show-calendar');
    });
    document.addEventListener('click', function (e) {
        if (!calendar2.contains(e.target) && !calendarIcon.contains(e.target)) {
            calendar2.classList.remove('show-calendar');
        }
    });
}


// // Function to toggle the dropdown
// document.querySelectorAll('.dropdown-btn').forEach((btn) => {
//     btn.addEventListener('click', function () {
//         const dropdown = this.nextElementSibling;
//         dropdown.classList.toggle('show');
//     });
// });

// // Close dropdown if clicking outside
// document.addEventListener('click', function (e) {
//     if (!e.target.matches('.dropdown-btn')) {
//         document.querySelectorAll('.dropdown-content').forEach((dropdown) => {
//             dropdown.classList.remove('show');
//         });
//     }
// });

// // Add event listeners to dropdown items
// document.querySelectorAll('.dropdown-item').forEach((item) => {
//     item.addEventListener('click', function () {
//         const value = this.getAttribute('data-value');
//         const btn = this.closest('.dropdown').querySelector('.dropdown-btn');
//         btn.textContent = this.textContent;
//         this.closest('.dropdown-content').classList.remove('show');
//     });
// });



// Function to toggle the dropdown and arrow rotation
document.querySelectorAll('.dropdown-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
        const dropdown = this.nextElementSibling;
        dropdown.classList.toggle('show');
        this.classList.toggle('rotate'); // Toggle arrow rotation
    });
});

// Close dropdown and reset arrow if clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown-btn')) {
        document.querySelectorAll('.dropdown-content').forEach((dropdown) => {
            dropdown.classList.remove('show');
        });
        document.querySelectorAll('.dropdown-btn').forEach((btn) => {
            btn.classList.remove('rotate'); // Reset arrow rotation
        });
    }
});

// Add event listeners to dropdown items
document.querySelectorAll('.dropdown-item').forEach((item) => {
    item.addEventListener('click', function () {
        const value = this.getAttribute('data-value');
        const btn = this.closest('.dropdown').querySelector('.dropdown-btn');
        btn.textContent = this.textContent;
        this.closest('.dropdown-content').classList.remove('show');
        btn.classList.remove('rotate'); // Reset arrow after selection
    });
});

/*------------------------------------- Download and Save Svg Selector -------------------------------------*/
const saveSvgIcon = document.querySelector('.save-svg');
const downloadSvgIcon = document.querySelector('.download-svg');
if (saveSvgIcon) {
    saveSvgIcon.addEventListener('click', function () {
        saveSvgIcon.style.border = '1px solid #35D168';
        saveSvgIcon.style.background = 'rgba(53, 209, 104, 0.10)';
        saveSvgIcon.style.filter = 'brightness(0) saturate(100%) invert(60%) sepia(75%) saturate(394%) hue-rotate(87deg) brightness(95%) contrast(98%)';
    });
}
if (saveSvgIcon) {
    downloadSvgIcon.addEventListener('click', function () {
        downloadSvgIcon.style.border = '1px solid #2466FF';
        downloadSvgIcon.style.background = 'rgba(36, 102, 255, 0.12)';
        downloadSvgIcon.style.filter = 'brightness(0) saturate(100%) invert(29%) sepia(88%) saturate(2367%) hue-rotate(216deg) brightness(99%) contrast(104%)';
    });
}

/*------------------------------------- Social Icons -------------------------------------*/
var contentToToggle = $('.social');
var toggleButton = $('.js-btn-open');

toggleButton.on('click', function (e) {
    e.preventDefault();
    contentToToggle.toggleClass('open');
    e.stopPropagation(); 
});

$(document).on('click', function (e) {
    if (!contentToToggle.is(e.target) && contentToToggle.has(e.target).length === 0 && !toggleButton.is(e.target)) {
        contentToToggle.removeClass('open');
    }
});

/*------------------------------------- Email Dropdown list -------------------------------------*/
document.addEventListener('DOMContentLoaded', function () {
    const dropdownBtn = document.querySelector('.dropdown-btn-email');
    const dropdownList = document.querySelector('.dropdown-list-email');

    if (dropdownBtn && dropdownList) {
        dropdownBtn.addEventListener('click', function () {
            dropdownList.classList.toggle('show');
        });

        window.addEventListener('click', function (event) {
            if (!event.target.matches('.dropdown-btn-email')) {
                dropdownList.classList.remove('show');
            }
        });
    }
});

/*------------------------------------- Email Star fill -------------------------------------*/
const starIcons = document.querySelectorAll('.star-icon');
starIcons.forEach(function (starIcon) {
    starIcon.addEventListener('click', function () {
        this.classList.toggle('active');
    });
});

/*------------------------------------- Email Side menu Toggle -------------------------------------*/
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.querySelector('.side-menu2');
    const menuItems = document.querySelectorAll('.menu-list-main li');
    const hamburgerIcon = document.getElementById('hamburger-1');
    const closeIcon = document.querySelector('.close-icon');

    if (menuToggle && sideMenu && hamburgerIcon && closeIcon) {
        closeIcon.style.display = 'none';
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            sideMenu.classList.toggle('show');

            if (sideMenu.classList.contains('show')) {
                hamburgerIcon.style.display = 'none';
                closeIcon.style.display = 'block';
            } else {
                hamburgerIcon.style.display = 'block';
                closeIcon.style.display = 'none';
            }
        });

        menuItems.forEach(item => {
            item.addEventListener('click', function (event) {
                event.preventDefault();
                const targetId = this.querySelector('a').getAttribute('href').substring(1);
                document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
                menuToggle.classList.remove('open');
                sideMenu.classList.remove('show');

                hamburgerIcon.style.display = 'block';
                closeIcon.style.display = 'none';
            });
        });

        $(".hamburger").click(function () {
            $(this).toggleClass("is-active");
        });
    }
});

/*-------------------------------------Update profile img-------------------------------------*/
$(document).ready(function () {
    var readURL = function (input, targetImage) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $(targetImage).attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    };

    $(document).on('change', '.file-upload', function () {
        var targetImage = $(this).closest('.profile-div-main').find('.profile-pic');
        readURL(this, targetImage);
    });

    $(document).on('click', '.upload-button', function () {
        var targetInput = $(this).attr('data-target');
        $(targetInput).click();
    });
});

/*-------------------------------------Email open Box dropdown-------------------------------------*/
document.addEventListener("DOMContentLoaded", function () {
    var moreMessElements = document.getElementsByClassName("more-mess");

    for (var i = 0; i < moreMessElements.length; i++) {
        moreMessElements[i].addEventListener("click", function (event) {
            event.stopPropagation();
            var moreShowBox = document.querySelector(".more-show");
            if (moreShowBox) {
                if (moreShowBox.style.display === "none" || moreShowBox.style.display === "") {
                    moreShowBox.style.display = "block";
                } else {
                    moreShowBox.style.display = "none";
                }
            }
        });
    }
    document.addEventListener("click", function () {
        var moreShowBox = document.querySelector(".more-show");
        if (moreShowBox) {
            moreShowBox.style.display = "none";
        }
    });
});

/*-------------------------------------Staff Edit Delete-------------------------------------*/
document.addEventListener("DOMContentLoaded", function () {
    var moreWhiteElements = document.getElementsByClassName("more-white");

    for (var i = 0; i < moreWhiteElements.length; i++) {
        moreWhiteElements[i].addEventListener("click", function (event) {
            event.stopPropagation();

            var shortPopUpBox = this.nextElementSibling;

            if (shortPopUpBox) {
                if (shortPopUpBox.style.display === "none" || shortPopUpBox.style.display === "") {
                    shortPopUpBox.style.display = "block";
                } else {
                    shortPopUpBox.style.display = "none";
                }
            }
        });
    }

    document.addEventListener("click", function () {
        var allPopUps = document.querySelectorAll(".short-popUp");
        allPopUps.forEach(function (popUp) {
            popUp.style.display = "none";
        });
    });
});
