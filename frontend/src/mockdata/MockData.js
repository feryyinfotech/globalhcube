import {
  Create,
  Login,
  ProductionQuantityLimitsOutlined,
} from '@mui/icons-material';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AssessmentIcon from '@mui/icons-material/Assessment';

// Full sidebar for admin/office users — unchanged.
export const all_Data = [
  {
    id: 1,
    navLink: '/dashboard',
    navItem: 'Dashboard',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
      </span>
    ),
  },
  {
    id: 2,
    navLink: '/all_lead_source',
    navItem: 'Master',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
      </span>
    ),
    subcomponent: [
      {
        id: 3.2,
        navLink: '/all_lead_source',
        navItem: ' Lead Source',
        navIcon: (
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
        ),
      },
      {
        id: 3.2,
        navLink: '/all_project_list',
        navItem: ' Products ',
        navIcon: (
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4L3 8M7 4l4 4"/><path d="M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
          </span>
        ),
      },
    ],
  },
  {
    id: 3,
    navLink: '/emply_registration',
    navItem: 'Employee ',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </span>
    ),
    subcomponent: [
      {
        id: 2.1,
        navLink: '/emply_registration',
        navItem: ' Registration',
        navIcon: (
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4L3 8M7 4l4 4"/><path d="M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
          </span>
        ),
      },
      {
        id: 2.2,
        navLink: '/emply_registration_list',
        navItem: 'All Employee ',
        navIcon: (
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4L3 8M7 4l4 4"/><path d="M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
          </span>
        ),
      },
      {
        id: 6,
        navLink: '/users',
        navItem: 'Employee Login',
        navIcon: (
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4L3 8M7 4l4 4"/><path d="M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
          </span>
        ),
      },
    ],
  },
  {
    id: 5,
    navLink: '/create_lead',
    navItem: 'Create Lead',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
      </span>
    ),
    subcomponent: [
      {
        id: 4.1,
        navLink: '/create_lead',
        navItem: 'Create Lead',
        navIcon: (
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
          </span>
        ),
      },
      {
        id: 4.1,
        navLink: '/basic_lead',
        navItem: 'Basic Lead',
        navIcon: (
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
          </span>
        ),
      },
    ],
  },
  {
    id: 4.2,
    navLink: '/assign_leads',
    navItem: 'Assign Leads',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
      </span>
    ),
  },
  {
    id: 5,
    navLink: '/transfer_lead',
    navItem: 'Transfer Lead',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4L3 8M7 4l4 4"/><path d="M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
      </span>
    ),
  },
  {
    id: 5.1,
    navLink: '/lead_report_all',
    navItem: 'Lead Report',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      </span>
    ),
  },

];

// Minimal sidebar for employees — no nested submenus.
export const emp_Data = [
  {
    id: 1,
    navLink: '/employee-dashboard',
    navItem: 'Dashboard',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg> 
      </span>
    ),
  },
  {
    id: 2,
    navLink: '/employee-create-lead',
    navItem: 'Create Lead',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
      </span>
    ),
  },
  {
    id: 3,
    navLink: '/employee-my-leads',
    navItem: 'Lead List',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>
      </span>
    ),
  },
  {
    id: 4,
    navLink: '/employee-update-follow',
    navItem: 'Update Follow',
    navIcon: (
      <span>
        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4"/></svg>
      </span>
    ),
  },
];

export const getSidebarNavData = () => {
  const role = localStorage.getItem('user_role');
  return role === 'employee' ? emp_Data : all_Data;
};