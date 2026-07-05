/* ==========================================================================
   LUXURY CONCIERGE & PRIVATE VILLA MANAGEMENT NETWORK - JAVASCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Global App State
  const state = {
    theme: localStorage.getItem('theme') || 'light',
    dir: localStorage.getItem('dir') || 'ltr',
    currentView: 'home1-view',
    isLoggedIn: false,
    currentUser: null,
    dashboardTab: {
      user: 'overview',
      admin: 'overview'
    },
    // Mock Database for dynamic widgets
    selectedPreviewVilla: 'villa-aurora',
    villas: {
      'villa-aurora': {
        name: 'Villa Aurora',
        location: 'Monaco Coast',
        bookedDays: [4, 5, 12, 13, 14, 19, 20, 21, 28, 29]
      },
      'villa-celeste': {
        name: 'Villa Celeste',
        location: 'Amalfi Cliffs',
        bookedDays: [1, 2, 8, 9, 15, 16, 22, 23, 24, 30]
      },
      'villa-solis': {
        name: 'Villa Solis',
        location: 'Maldives Lagoon',
        bookedDays: [3, 6, 7, 10, 11, 17, 18, 25, 26, 27]
      }
    },
    maintenanceTickets: [
      { id: 'MNT-101', villa: 'Villa Aurora', issue: 'AC Filtration Service', status: 'Resolved', date: '2026-06-12' },
      { id: 'MNT-102', villa: 'Villa Celeste', issue: 'Pool Filtration Leak Check', status: 'In Progress', date: '2026-06-17' },
      { id: 'MNT-103', villa: 'Villa Solis', issue: 'Helipad Beacon Inspection', status: 'Scheduled', date: '2026-06-22' }
    ],
    housekeepingAssignments: [
      { room: 'Villa Aurora - Master Suite', staff: 'Elena Rostova', tasks: ['Deep clean sheets', 'Refill Bvlgari toiletries', 'Polishing brass fittings'], status: 'In Progress' },
      { room: 'Villa Aurora - Ocean Pavilion', staff: 'Jean-Luc Dubois', tasks: ['Floor vacuuming', 'Glass facade washing', 'Wine cellar inventory'], status: 'Pending' },
      { room: 'Villa Celeste - Infinity Lounge', staff: 'Maria Santos', tasks: ['Terrace sanitation', 'Cushion replacement', 'Orchid styling'], status: 'Completed' }
    ]
  };

  // DOM Elements
  const htmlEl = document.documentElement;
  const headerWrapper = document.getElementById('header-wrapper');
  const footerEl = document.getElementById('footer-el');
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const rtlToggles = document.querySelectorAll('.rtl-toggle');
  const loginBtns = document.querySelectorAll('.login-trigger');
  // Auth View Forms
  const loginFormNew = document.getElementById('login-form-new');
  const registerFormNew = document.getElementById('register-form-new');
  
  // Mobile Nav Drawer Elements
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileDrawerClose = document.getElementById('mobile-drawer-close');
  const mobileOverlay = document.getElementById('mobile-overlay');

  // Chart instances trackers
  let userIncomeChart = null;
  let userOccupancyChart = null;
  let adminIncomeChart = null;
  let adminOccupancyChart = null;

  /* --------------------------------------------------------------------------
     1. Theme & LTR/RTL Control Functions
     -------------------------------------------------------------------------- */
  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    state.theme = theme;
    
    // Update toggle icons
    themeToggles.forEach(btn => {
      const icon = btn.querySelector('i');
      if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
      } else {
        icon.className = 'fa-solid fa-moon';
      }
    });
  }

  function applyDirection(dir) {
    htmlEl.setAttribute('dir', dir);
    localStorage.setItem('dir', dir);
    state.dir = dir;

    // Toggle button active styling or label changes
    rtlToggles.forEach(btn => {
      btn.textContent = dir === 'rtl' ? 'LTR' : 'RTL';
    });
    
    // Redraw charts if present to update labels layout properly
    if (state.currentView.includes('dashboard')) {
      initDashboardCharts(state.currentView.split('-')[0]);
    }
  }

  // Bind theme toggle buttons
  themeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  });

  // Bind RTL/LTR toggle buttons
  rtlToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextDir = state.dir === 'rtl' ? 'ltr' : 'rtl';
      applyDirection(nextDir);
    });
  });

  // Init themes
  applyTheme(state.theme);
  applyDirection(state.dir);

  /* --------------------------------------------------------------------------
     2. SPA Views Router
     -------------------------------------------------------------------------- */
  function showView(viewId) {
    // Hide all views
    const allViews = document.querySelectorAll('.spa-view');
    allViews.forEach(view => {
      view.classList.remove('active');
    });

    // Show targets
    const targetView = document.getElementById(viewId);
    if (!targetView) return;

    targetView.classList.add('active');
    targetView.classList.add('fade-in');
    state.currentView = viewId;

    // Handle Header & Footer displays
    if (viewId === 'user-dashboard-view' || viewId === 'admin-dashboard-view' || viewId === 'login-view' || viewId === 'register-view') {
      headerWrapper.style.display = 'none';
      footerEl.style.display = 'none';
      if (viewId.includes('dashboard')) {
        document.body.classList.add('dashboard-active');
        const role = viewId.split('-')[0]; // 'user' or 'admin'
        initDashboardTab(role, state.dashboardTab[role]);
      } else {
        document.body.classList.remove('dashboard-active');
      }
    } else {
      headerWrapper.style.display = 'flex';
      footerEl.style.display = 'block';
      document.body.classList.remove('dashboard-active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update main nav active link statuses
    updateNavActiveLinks(viewId);

    // Auto-close drawers/overlays
    closeMobileDrawer();
  }

  function updateNavActiveLinks(viewId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    // Map view IDs to nav links
    let activeLinkId = '';
    if (viewId === 'home1-view' || viewId === 'home2-view') {
      activeLinkId = 'nav-home';
    } else if (viewId === 'about-view') {
      activeLinkId = 'nav-about';
    } else if (viewId === 'destinations-view') {
      activeLinkId = 'nav-destinations';
    } else if (viewId === 'services-view') {
      activeLinkId = 'nav-services';
    } else if (viewId === 'contact-view') {
      activeLinkId = 'nav-contact';
    }

    if (activeLinkId) {
      const activeItem = document.getElementById(activeLinkId);
      if (activeItem) activeItem.classList.add('active');
    }
  }

  // Setup click listeners on router links
  document.querySelectorAll('[data-route]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetRoute = link.getAttribute('data-route');
      showView(targetRoute);
    });
  });

  // Sticky header scroll trigger
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      headerWrapper.classList.add('scrolled');
    } else {
      headerWrapper.classList.remove('scrolled');
    }
  });

  /* --------------------------------------------------------------------------
     3. Mobile Drawer Controls
     -------------------------------------------------------------------------- */
  function openMobileDrawer() {
    mobileNavDrawer.classList.add('open');
    mobileOverlay.classList.add('active');
  }

  function closeMobileDrawer() {
    mobileNavDrawer.classList.remove('open');
    mobileOverlay.classList.remove('active');
  }

  hamburgerBtn.addEventListener('click', openMobileDrawer);
  mobileDrawerClose.addEventListener('click', closeMobileDrawer);
  mobileOverlay.addEventListener('click', closeMobileDrawer);

  // Mobile accordion submenu toggles
  document.querySelectorAll('.mobile-menu-item.has-submenu .menu-title-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      const parent = wrapper.closest('.mobile-menu-item');
      if (parent) {
        parent.classList.toggle('open');
      }
    });
  });

  /* --------------------------------------------------------------------------
     4. Auth Logic & Login Modals
     -------------------------------------------------------------------------- */
  loginBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showView('login-view');
    });
  });

  if (loginFormNew) {
    loginFormNew.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username-new').value;
      const role = document.getElementById('login-role-new').value;

      state.isLoggedIn = true;
      state.currentUser = {
        username: username || 'Lord Mountbatten',
        role: role
      };

      // Redirect to proper portal
      if (role === 'admin') {
        showView('admin-dashboard-view');
      } else {
        showView('user-dashboard-view');
      }

      updateProfileBadges();
    });
  }

  if (registerFormNew) {
    registerFormNew.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Registration request submitted successfully! Redirecting to credentials portal...');
      showView('login-view');
    });
  }

  function updateProfileBadges() {
    if (!state.isLoggedIn) return;
    
    // Update name/roles inside dashboard UI elements
    const dashboardRole = state.currentUser.role;
    const profileNames = document.querySelectorAll(`.dash-profile-name`);
    const profileRoles = document.querySelectorAll(`.dash-profile-role`);
    
    profileNames.forEach(nameEl => {
      nameEl.textContent = state.currentUser.username;
    });

    profileRoles.forEach(roleEl => {
      roleEl.textContent = dashboardRole === 'admin' ? 'Elite Network Manager' : 'Premium Villa Owner';
    });
  }

  // Logouts
  document.querySelectorAll('.logout-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      state.isLoggedIn = false;
      state.currentUser = null;
      showView('home1-view');
    });
  });

  /* --------------------------------------------------------------------------
     5. Home Page Interactive Widgets
     -------------------------------------------------------------------------- */
  // Home 1 Occupancy preview villa selectors
  const oppSelectors = document.querySelectorAll('.opp-selector-item');
  if (oppSelectors.length > 0) {
    oppSelectors.forEach(sel => {
      sel.addEventListener('click', () => {
        oppSelectors.forEach(s => s.classList.remove('active'));
        sel.classList.add('active');
        state.selectedPreviewVilla = sel.getAttribute('data-villa');
        renderPreviewCalendar();
      });
    });
  }

  function renderPreviewCalendar() {
    const calendarGrid = document.getElementById('opp-calendar-grid');
    if (!calendarGrid) return;

    // Clear grid but keep headers
    const headerDays = calendarGrid.querySelectorAll('.opp-cal-day-header');
    calendarGrid.innerHTML = '';
    headerDays.forEach(h => calendarGrid.appendChild(h));

    const villaData = state.villas[state.selectedPreviewVilla];
    if (!villaData) return;

    // Month details (Mocking October 2026 starting on Thursday)
    const totalDays = 31;
    const startOffset = 4; // Thursday index (0: Sun, 1: Mon, etc.)

    // Fill offset empty cells
    for (let i = 0; i < startOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'opp-cal-day empty';
      calendarGrid.appendChild(emptyCell);
    }

    // Fill days
    for (let d = 1; d <= totalDays; d++) {
      const dayCell = document.createElement('div');
      const isBooked = villaData.bookedDays.includes(d);
      
      dayCell.className = `opp-cal-day ${isBooked ? 'booked' : 'available'}`;
      dayCell.innerHTML = `<span>${d}</span>`;
      calendarGrid.appendChild(dayCell);
    }
  }

  renderPreviewCalendar();

  /* --------------------------------------------------------------------------
     6. About Timeline Rendering
     -------------------------------------------------------------------------- */
  // Hover transitions on timeline nodes
  document.querySelectorAll('.timeline-content-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const node = card.parentElement.querySelector('.timeline-node');
      if (node) {
        node.style.backgroundColor = 'var(--color-accent)';
        node.style.transform = 'translateX(-50%) scale(1.3)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const node = card.parentElement.querySelector('.timeline-node');
      if (node) {
        node.style.backgroundColor = 'var(--bg-primary)';
        node.style.transform = 'translateX(-50%) scale(1)';
      }
    });
  });

  /* --------------------------------------------------------------------------
     7. Services Interactive Accordion / Page logic
     -------------------------------------------------------------------------- */
  // FAQ accordion handler
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const parent = q.parentElement;
      const isActive = parent.classList.contains('active');
      
      // Close all
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      if (!isActive) {
        parent.classList.add('active');
      }
    });
  });

  /* --------------------------------------------------------------------------
     8. Contact Interactive Scheduler & Form Captures
     -------------------------------------------------------------------------- */
  const schedDays = document.querySelectorAll('.sched-day');
  const timeSlots = document.querySelectorAll('.time-slot');
  let selectedDate = null;
  let selectedTime = null;

  schedDays.forEach(day => {
    day.addEventListener('click', () => {
      if (day.classList.contains('disabled')) return;
      schedDays.forEach(d => d.classList.remove('selected'));
      day.classList.add('selected');
      selectedDate = day.getAttribute('data-date');
    });
  });

  timeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      timeSlots.forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selectedTime = slot.getAttribute('data-time');
    });
  });

  const secureConsultationForm = document.getElementById('secure-consultation-form');
  if (secureConsultationForm) {
    secureConsultationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert(`Bespoke Consultation Scheduled successfully.\nDate: ${selectedDate || 'Pending Selection'}\nTime slot: ${selectedTime || 'Pending Selection'}\nOur Private Secretary will reach out in 15 minutes.`);
      secureConsultationForm.reset();
      schedDays.forEach(d => d.classList.remove('selected'));
      timeSlots.forEach(s => s.classList.remove('selected'));
    });
  }

  /* --------------------------------------------------------------------------
     9. Dashboard Portal Controllers
     -------------------------------------------------------------------------- */
  function initDashboardTab(role, tabId) {
    state.dashboardTab[role] = tabId;

    // Update active tab buttons in current dashboard view sidebar
    const dashboardView = document.getElementById(`${role}-dashboard-view`);
    const menuItems = dashboardView.querySelectorAll('.dash-menu-item');
    menuItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-dash-tab') === tabId) {
        item.classList.add('active');
      }
    });

    // Update active tab panes
    const tabPanes = dashboardView.querySelectorAll('.dash-tab-pane');
    tabPanes.forEach(pane => {
      pane.classList.remove('active');
      if (pane.id === `${role}-dash-${tabId}`) {
        pane.classList.add('active');
        pane.classList.add('fade-in');
      }
    });

    // Sub-modules setup
    if (tabId === 'overview') {
      initDashboardCharts(role);
    } else if (tabId === 'occupancy') {
      renderDashboardCalendar(role);
    } else if (tabId === 'maintenance') {
      renderMaintenanceLogs(role);
    } else if (tabId === 'housekeeping') {
      renderHousekeepingSchedule(role);
    }

    // Toggle sidebar closed on mobile
    const sidebar = dashboardView.querySelector('.dash-sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  // Hook tab triggers
  document.querySelectorAll('.dash-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const role = item.closest('.dashboard-layout').id.split('-')[0];
      const tabId = item.getAttribute('data-dash-tab');
      initDashboardTab(role, tabId);
    });
  });



  /* --- Sub-module: Charts Initialization --- */
  function initDashboardCharts(role) {
    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textLabelColor = isDark ? '#A1A1A6' : '#5C5C60';
    const accentColor = state.theme === 'dark' ? '#E5C17C' : '#B89047';

    // 1. Line Chart (Income)
    const incomeCtx = document.getElementById(`${role}-income-canvas`);
    if (incomeCtx) {
      // Destroy existing instance to prevent layering bugs
      if (role === 'user' && userIncomeChart) userIncomeChart.destroy();
      if (role === 'admin' && adminIncomeChart) adminIncomeChart.destroy();

      const labelMonths = state.dir === 'rtl' ? ['ديسمبر', 'نوفمبر', 'أكتوبر', 'سبتمبر', 'أغسطس', 'يوليو', 'يونيو', 'مايو', 'أبريل', 'مارس', 'فبراير', 'يناير'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dataSetVal = role === 'admin' 
        ? [420000, 490000, 520000, 480000, 610000, 750000, 890000, 850000, 710000, 680000, 720000, 950000]
        : [28000, 31000, 29000, 35000, 42000, 51000, 63000, 58000, 47000, 42000, 49000, 68000];

      const instance = new Chart(incomeCtx, {
        type: 'line',
        data: {
          labels: labelMonths,
          datasets: [{
            label: role === 'admin' ? 'Total Platform Billings ($)' : 'Villa Rental Income ($)',
            data: state.dir === 'rtl' ? [...dataSetVal].reverse() : dataSetVal,
            borderColor: accentColor,
            backgroundColor: 'rgba(184, 144, 71, 0.08)',
            borderWidth: 2,
            tension: 0.35,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textLabelColor }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textLabelColor }
            }
          }
        }
      });

      if (role === 'user') userIncomeChart = instance;
      if (role === 'admin') adminIncomeChart = instance;
    }

    // 2. Bar Chart (Occupancy Rate)
    const occupancyCtx = document.getElementById(`${role}-occupancy-canvas`);
    if (occupancyCtx) {
      if (role === 'user' && userOccupancyChart) userOccupancyChart.destroy();
      if (role === 'admin' && adminOccupancyChart) adminOccupancyChart.destroy();

      const labelVillas = role === 'admin' ? ['Villa Aurora', 'Villa Celeste', 'Villa Solis', 'Villa Nidus', 'Villa Zephyr'] : ['Villa Aurora', 'Villa Celeste', 'Villa Solis'];
      const dataOccupancy = role === 'admin' ? [85, 78, 92, 64, 73] : [85, 78, 92];

      const instance = new Chart(occupancyCtx, {
        type: 'bar',
        data: {
          labels: labelVillas,
          datasets: [{
            label: 'Occupancy Rate (%)',
            data: dataOccupancy,
            backgroundColor: [accentColor, 'rgba(184, 144, 71, 0.6)', 'rgba(184, 144, 71, 0.35)', '#2D3748', '#4A5568'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textLabelColor }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textLabelColor },
              max: 100
            }
          }
        }
      });

      if (role === 'user') userOccupancyChart = instance;
      if (role === 'admin') adminOccupancyChart = instance;
    }
  }

  /* --- Sub-module: Dashboard Custom Calendar Widget --- */
  function renderDashboardCalendar(role) {
    const calendarEl = document.getElementById(`${role}-dash-calendar`);
    if (!calendarEl) return;

    calendarEl.innerHTML = '';

    // Mock Calendar Data for Owner Dashboard (October 2026)
    const totalDays = 31;
    const startOffset = 4; // Thurs start

    // Create Calendar Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'dash-cal-grid-row';
    const weekDays = state.dir === 'rtl' 
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    weekDays.forEach(day => {
      const dayHead = document.createElement('div');
      dayHead.className = 'dash-cal-grid-header';
      dayHead.textContent = day;
      headerRow.appendChild(dayHead);
    });
    calendarEl.appendChild(headerRow);

    // Grid construction
    let currentGridRow = document.createElement('div');
    currentGridRow.className = 'dash-cal-grid-row';
    
    // Fill offsets
    for (let i = 0; i < startOffset; i++) {
      const offsetCell = document.createElement('div');
      offsetCell.className = 'dash-cal-cell empty';
      currentGridRow.appendChild(offsetCell);
    }

    // Bookings registry mock
    const calendarBookings = {
      3: { name: 'Owner Reservation', type: 'owner' },
      4: { name: 'Owner Reservation', type: 'owner' },
      5: { name: 'Owner Reservation', type: 'owner' },
      11: { name: 'VIP Guest Arrival (Smit)', type: 'guest' },
      12: { name: 'VIP Guest Departure (Smit)', type: 'guest' },
      18: { name: 'AC Servicing Inspection', type: 'maintenance' },
      25: { name: 'Wedding Event Booking', type: 'guest' },
      26: { name: 'Wedding Event Booking', type: 'guest' }
    };

    // Days printing
    for (let day = 1; day <= totalDays; day++) {
      if ((day + startOffset - 1) % 7 === 0 && day > 1) {
        calendarEl.appendChild(currentGridRow);
        currentGridRow = document.createElement('div');
        currentGridRow.className = 'dash-cal-grid-row';
      }

      const cell = document.createElement('div');
      cell.className = 'dash-cal-cell';
      cell.innerHTML = `<span class="dash-cal-day-num">${day}</span>`;

      // Check if bookings fall on this day
      if (calendarBookings[day]) {
        const booking = calendarBookings[day];
        const tag = document.createElement('div');
        tag.className = `dash-cal-booking-tag ${booking.type}`;
        tag.textContent = booking.name;
        cell.appendChild(tag);
      }

      currentGridRow.appendChild(cell);
    }

    // Append last row
    // Fill trailing empty cells
    const finalCells = currentGridRow.querySelectorAll('.dash-cal-cell').length;
    if (finalCells > 0) {
      for (let i = 0; i < (7 - finalCells); i++) {
        const offsetCell = document.createElement('div');
        offsetCell.className = 'dash-cal-cell empty';
        currentGridRow.appendChild(offsetCell);
      }
      calendarEl.appendChild(currentGridRow);
    }
  }

  /* --- Sub-module: Maintenance Logs Table Renders --- */
  function renderMaintenanceLogs(role) {
    const tableBody = document.getElementById(`${role}-maintenance-table-body`);
    if (!tableBody) return;

    tableBody.innerHTML = '';

    state.maintenanceTickets.forEach(ticket => {
      const tr = document.createElement('tr');
      
      let badgeClass = 'warning';
      if (ticket.status === 'Resolved') badgeClass = 'success';
      if (ticket.status === 'Scheduled') badgeClass = 'danger';

      tr.innerHTML = `
        <td><strong>${ticket.id}</strong></td>
        <td>${ticket.villa}</td>
        <td>${ticket.issue}</td>
        <td>${ticket.date}</td>
        <td><span class="status-pill ${badgeClass}">${ticket.status}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Handle new ticket submissions in owner portal
  const newTicketForm = document.getElementById('user-new-ticket-form');
  if (newTicketForm) {
    newTicketForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const villa = document.getElementById('ticket-villa').value;
      const issue = document.getElementById('ticket-issue').value;

      const newId = `MNT-${Math.floor(100 + Math.random() * 900)}`;
      const dateToday = new Date().toISOString().split('T')[0];

      state.maintenanceTickets.unshift({
        id: newId,
        villa: villa,
        issue: issue,
        status: 'Scheduled',
        date: dateToday
      });

      newTicketForm.reset();
      renderMaintenanceLogs('user');
      alert(`Maintenance Ticket Created Successfully: ID: ${newId}`);
    });
  }

  /* --- Sub-module: Housekeeping Schedules Renders --- */
  function renderHousekeepingSchedule(role) {
    const rosterContainer = document.getElementById(`${role}-roster-container`);
    if (!rosterContainer) return;

    rosterContainer.innerHTML = '';

    state.housekeepingAssignments.forEach((assign, index) => {
      const card = document.createElement('div');
      card.className = 'roster-card';

      let statusBadge = 'warning';
      if (assign.status === 'Completed') statusBadge = 'success';

      let taskListItems = '';
      assign.tasks.forEach((task, tIdx) => {
        const isChecked = assign.status === 'Completed';
        taskListItems += `
          <li>
            <input type="checkbox" id="task-${index}-${tIdx}" ${isChecked ? 'checked' : ''} data-card-idx="${index}" data-task-idx="${tIdx}">
            <label for="task-${index}-${tIdx}">${task}</label>
          </li>
        `;
      });

      // Simple mock staff avatar list
      const staffAvatar = `v14.jpg`;

      card.innerHTML = `
        <div class="roster-card-header">
          <span class="roster-room">${assign.room}</span>
          <span class="status-pill ${statusBadge}">${assign.status}</span>
        </div>
        <div class="roster-staff">
          <img src="${staffAvatar}" class="roster-staff-img" alt="staff">
          <span>Roster: <strong>${assign.staff}</strong></span>
        </div>
        <ul class="roster-tasks">
          ${taskListItems}
        </ul>
      `;

      // Add listener to checkboxes inside
      card.querySelectorAll('input[type="checkbox"]').forEach(box => {
        box.addEventListener('change', (e) => {
          const cardIdx = e.target.getAttribute('data-card-idx');
          const taskIdx = e.target.getAttribute('data-task-idx');
          
          // Toggle tasks logic (mocking completion updates)
          const allBoxes = box.closest('.roster-tasks').querySelectorAll('input[type="checkbox"]');
          const checkedBoxes = box.closest('.roster-tasks').querySelectorAll('input[type="checkbox"]:checked');
          
          if (allBoxes.length === checkedBoxes.length) {
            state.housekeepingAssignments[cardIdx].status = 'Completed';
          } else {
            state.housekeepingAssignments[cardIdx].status = 'In Progress';
          }
          
          renderHousekeepingSchedule(role);
        });
      });

      rosterContainer.appendChild(card);
    });
  }

  // Handle new assignments inside admin portal
  const adminNewRosterForm = document.getElementById('admin-new-roster-form');
  if (adminNewRosterForm) {
    adminNewRosterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const room = document.getElementById('roster-villa').value;
      const staff = document.getElementById('roster-staff-name').value;
      const task1 = document.getElementById('roster-task-1').value;
      const task2 = document.getElementById('roster-task-2').value;

      state.housekeepingAssignments.unshift({
        room: room,
        staff: staff,
        tasks: [task1, task2].filter(t => t.trim() !== ''),
        status: 'Pending'
      });

      adminNewRosterForm.reset();
      renderHousekeepingSchedule('admin');
      alert(`Housekeeping Schedule created successfully for ${staff}.`);
    });
  }

  // Mobile Dashboard Sidebar Toggle Actions
  document.querySelectorAll('.dash-sidebar-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const layout = btn.closest('.dashboard-layout');
      if (layout) {
        const sidebar = layout.querySelector('.dash-sidebar');
        if (sidebar) {
          sidebar.classList.toggle('open');
        }
      }
    });
  });

  document.querySelectorAll('.dash-menu-item a').forEach(itemLink => {
    itemLink.addEventListener('click', () => {
      const sidebar = itemLink.closest('.dash-sidebar');
      if (sidebar) {
        sidebar.classList.remove('open');
      }
    });
  });

  // Close dashboard sidebars when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
      const openSidebars = document.querySelectorAll('.dash-sidebar.open');
      openSidebars.forEach(sidebar => {
        const toggleBtn = sidebar.closest('.dashboard-layout').querySelector('.dash-sidebar-toggle-btn');
        if (toggleBtn && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  });

  // Default start page
  showView('home1-view');
});
