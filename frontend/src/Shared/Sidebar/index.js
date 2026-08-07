import { ExpandLess, ExpandMore, Logout } from '@mui/icons-material';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import {
  Collapse,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSidebarNavData } from '../../mockdata/MockData';
import loginlogo from '../../Assets/logo.png';

// The "Follow-ups" menu is a fixed 3-way split (matches the 3 top-level
// options in the follow-up composer): scheduling a next touchpoint, closing
// the lead, or marking it sold. Each maps onto its own follow_up_types row.
const FOLLOWUP_MENU_ITEMS = [
  { id: 'next-appointment', label: 'Next Appointment', link: 'next-appointment', hasSlug: false },
  { id: 'lead-close', label: 'Lead Close', link: 'lead-close', hasSlug: true },
  { id: 'sale-done', label: 'Sale Done', link: 'sale-done', hasSlug: true },
];

// "Status" is independent of the Follow-ups flow above — a fixed set of
// outcome labels tracked via the separate follow_status column, so they get
// their own menu instead of being mixed into Follow-ups.
const STATUS_MENU_ITEMS = [
  { id: 'site-visit-done', label: 'Site Visit Done', link: 'site-visit-done' },
  { id: 'office-group-bop-done', label: 'Office Group BOP Done', link: 'office-group-bop-done' },
  { id: 'office-one-to-one-bop-done', label: 'Office One to One BOP Done', link: 'office-one-to-one-bop-done' },
  { id: 'plot-meeting-done', label: 'Plot Meeting Done', link: 'plot-meeting-done' },
  { id: 'online-bop-done', label: 'Online BOP Done', link: 'online-bop-done' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [openSlide] = useState(true);
  const [openCollapse, setOpenCollapse] = useState({});
  const navData = getSidebarNavData();

  const userRole = localStorage.getItem('user_role');
  const isEmployee = userRole === 'employee';

  const followupTypeBase = isEmployee ? '/employee-followup-type' : '/followup-type';
  const nextAppointmentLink = isEmployee ? '/employee-next-appointment' : '/next-appointment';
  const statusBase = isEmployee ? '/employee-status' : '/status';

  const combinedNavData = [
    ...navData,
    {
      id: 'followup-types',
      navLink: nextAppointmentLink,
      navItem: 'Follow-ups',
      navIcon: (
        <span>
          <PhoneInTalkIcon color="#15317E" fontSize="medium" />
        </span>
      ),
      subcomponent: FOLLOWUP_MENU_ITEMS.map((item) => ({
        id: item.id,
        navLink: item.hasSlug ? `${followupTypeBase}/${item.link}` : nextAppointmentLink,
        navItem: item.label,
        navIcon: (
          <span>
            <AddToPhotosIcon color="#15317E" fontSize="medium" />
          </span>
        ),
      })),
    },
    {
      id: 'status-types',
      navLink: `${statusBase}/${STATUS_MENU_ITEMS[0].link}`,
      navItem: 'Status',
      navIcon: (
        <span>
          <FactCheckIcon color="#15317E" fontSize="medium" />
        </span>
      ),
      subcomponent: STATUS_MENU_ITEMS.map((item) => ({
        id: item.id,
        navLink: `${statusBase}/${item.link}`,
        navItem: item.label,
        navIcon: (
          <span>
            <AddToPhotosIcon color="#15317E" fontSize="medium" />
          </span>
        ),
      })),
    },
  ];

  const userName = localStorage.getItem('name');
  const userType = localStorage.getItem('user_type');
  const roleLabel = userRole === 'employee' ? 'Employee' : userType || 'Admin';

  const handleCollapse = (navLink) => {
    setOpenCollapse((prevState) => ({
      ...prevState,
      [navLink]: !prevState[navLink],
    }));
  };

  return (
    <div className={`SideBar !overflow-y-auto ${openSlide
        ? '!min-w-[250px] max-w-[250px]'
        : '!w-auto'
      }`}
    >
      <div className="sidebar_logo">
          <div className="logo_side">
            <img src={loginlogo} alt="logo" />
          </div>
          <div>
            <b>Global-H-Cube Services</b>
            <span>Lead Management</span>
          </div>
        </div>
        <div className="whoami">
          <div className="av">{userName ? userName.charAt(0).toUpperCase() : '?'}</div>
          <div>
            <b>{userName || 'Unknown'}</b>
            <span>{roleLabel}</span>
          </div>
        </div>
      <List>
        <div className="nav-label">Workspace</div>
        {combinedNavData?.map((nav) => (
          <React.Fragment key={nav.id} className="">
            <ListItemButton
              onClick={() => {
                navigate(nav.navLink);
                if (nav.subcomponent?.length > 0) {
                  handleCollapse(nav.navLink);
                }
              }}
              className={classNames(
                'nav-items',
                window.location.pathname === nav.navLink &&
                'nav-items-active'
              )}
            >
              <div className="nav-icon">
                {nav.navIcon}
              </div>
              <div className="nav-item">
                {nav.navItem}
              </div>

              {nav.subcomponent?.length > 0 && (
                <span>
                  {openCollapse[nav.navLink] ? <ExpandLess /> : <ExpandMore />}
                </span>
              )}
            </ListItemButton>
            <Collapse in={openCollapse[nav.navLink]} timeout="auto" unmountOnExit>
              <div className="relative pl-[0rem]">
                <List component="div" disablePadding >
                  {nav.subcomponent?.map((subNav) => (
                    <ListItemButton
                      key={subNav.id}
                      onClick={() => navigate(subNav.navLink)}
                      className={classNames(
                        'nav-items_sub',
                        window.location.pathname === subNav.navLink &&
                        'nav-items_sub-active'
                      )}
                    >
                      <span className="blulls" />
                      <ListItemText
                        primary={subNav.navItem}
                        primaryTypographyProps={{
                          className: 'm-0',
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </div>
            </Collapse>
          </React.Fragment>
        ))}
        <div className="nav-label">Account</div>
         <ListItemButton
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              navigate('/');
            }}
           className={classNames(
              'nav-items',
              window.location.pathname === '/logout' &&
              'nav-items-active'
            )}
          >
            <div className="nav-icon">
              <svg viewBox="0 0 24 24"><path d="M15 17l5-5-5-5M20 12H9M13 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/></svg>
            </div>
            <div className='nav-item'>
              <span>Logout</span>
            </div>
          </ListItemButton>
      </List>
      <div className="side-foot">
        <div className="quota">
          <b>Monthly target</b>
          <p>37 of 50 conversions closed</p>
          <div className="bar"><i style={{ width: '74%' }}></i></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
