import CustomerList from '../Pages/LeadReport/LeadReporting';
import UpdateCustomer from '../Pages/LeadReport/UpdateCustomer';
import EmpRegistration from '../Pages/EmpRegistration/Registration';
import LeadReporting from '../Pages/LeadReport/LeadReporting';
import AddLead from '../Pages/CreateLead/AddLead';
import Master from '../Pages/Master/Master';
import AllRegistration from '../Pages/EmpRegistration/AllRegistration';
import LoginAsEmployee from '../Pages/EmpRegistration/LoginAsEmployee';
import CreateSource from '../Pages/LeadSource/CreateSource';
import LeadSource from '../Pages/LeadSource/Lead';
import LeadList from '../Pages/CreateLead/LeadList';
import LeadReport from '../Pages/CreateLead/LeadReport';
import AssignLeads from '../Pages/CreateLead/AssignLeads';
import TransferLead from '../Pages/CreateLead/TransferLead';
import Addproject from '../Pages/Project/Addproject';
import Projectlist from '../Pages/Project/Projectlist';
import Addphase from '../Pages/Phase/AddPhase';
import Allphase from '../Pages/Phase/Allphaselist';
import Dashboard from '../Pages/Dashboard';
import LeadProfile from '../Pages/CreateLead/LeadProfile';
import AllChannelpartner from '../Pages/ChannelPartner/Channelpartnerlist';
import EmpDashboard from '../Pages/userpages/EmpDashboard';
import EmpCreateLead from '../Pages/userpages/EmpCreateLead';
import EmpLeadList from '../Pages/userpages/EmpLeadList';
import EmpUpdateFollow from '../Pages/userpages/EmpUpdateFollow';
import EmpLeadFollowup from '../Pages/userpages/EmpLeadFollowup';
import FollowupTypeLeads from '../Pages/CreateLead/FollowupTypeLeads';
import EmpFollowupTypeLeads from '../Pages/userpages/EmpFollowupTypeLeads';

export const routes = [
  {
    id: 1,
    path: '/dashboard',
    component: <Dashboard />,
    navItem: 'Dashboard',
  },
  {
    id: 1,
    path: '/master',
    component: <Master />,
    navItem: 'Master',
  },
  {
    id: 2,
    path: '/emply_registration',
    component: <EmpRegistration />,
    navItem: 'Employee Registration ',
  },
  {
    id: 3,
    path: '/emply_registration_list',
    component: <AllRegistration />,
    navItem: 'All  Employee',
  },
  {
    id: 4,
    path: '/create_lead_source',
    component: <CreateSource />,
    navItem: 'Create Lead Source',
  },
  {
    id: 5,
    path: '/all_lead_source',
    component: <LeadSource />,
    navItem: 'All Lead Source',
  },

  {
    id: 6,
    path: '/create_lead',
    component: <AddLead />,
    navItem: 'Create Lead',
  },
  {
    id: 7,
    path: '/basic_lead',
    component: <LeadList />,
    navItem: 'Basic Lead',
  },
  {
    id: 7,
    path: '/assign_leads',
    component: <AssignLeads />,
    navItem: 'Assign Leads',
  },
  {
    id: 7,
    path: '/transfer_lead',
    component: <TransferLead />,
    navItem: 'Transfer Lead',
  },
  {
    id: 7,
    path: '/lead_report_all',
    component: <LeadReport />,
    navItem: 'Lead Report',
  },
  {
    id: 7,
    path: '/followup-type/:slug',
    component: <FollowupTypeLeads />,
    navItem: 'Follow-up Type Leads',
  },
  {
    id: 7,
    path: '/next-appointment',
    component: <FollowupTypeLeads mode="next_appointment" />,
    navItem: 'Next Appointment Leads',
  },
  {
    id: 7,
    path: '/status/:slug',
    component: <FollowupTypeLeads mode="status" />,
    navItem: 'Status Leads',
  },
  {
    id: 8,
    path: '/project_create',
    component: <Addproject />,
    navItem: 'Add Project',
  },
  {
    id: 8,
    path: '/all_project_list',
    component: <Projectlist />,
    navItem: ' Project Details',
  },
  {
    id: 9,
    path: '/phase_create',
    component: <Addphase />,
    navItem: ' Phase Create',
  },
  {
    id: 10,
    path: '/all_phase',
    component: <Allphase />,
    navItem: ' Phase List',
  },
  {
    id: 5,
    path: '/profile/:lead_id',
    component: <LeadProfile />,
    navItem: 'Lead Profile',
  },
  {
    id: 6,
    path: '/channel',
    component: <AllChannelpartner />,
    navItem: 'Channel Partner',
  },

  //dummy
  {
    id: 5,
    path: '/lead_report',
    component: <LeadReporting />,
    navItem: 'Lead Reporting',
  },

  {
    id: 6,
    path: '/customer/update-customer',
    component: <UpdateCustomer />,
    navItem: 'Update Customer',
  },

  // emm
  {
    id: 7,
    path: '/employee-dashboard',
    component: <EmpDashboard />,
    navItem: 'Employee Dashboard',
  },

  {
    id: 8,
    path: '/employee-create-lead',
    component: <EmpCreateLead />,
    navItem: 'Create Lead',
  },

  {
    id: 9,
    path: '/employee-my-leads',
    component: <EmpLeadList />,
    navItem: 'Lead List',
  },

  {
    id: 10,
    path: '/employee-update-follow',
    component: <EmpUpdateFollow />,
    navItem: 'Update Follow',
  },

  {
    id: 10,
    path: '/employee-lead-followup/:lead_id',
    component: <EmpLeadFollowup />,
    navItem: 'Follow-up',
  },

  {
    id: 10,
    path: '/employee-followup-type/:slug',
    component: <EmpFollowupTypeLeads />,
    navItem: 'Follow-up Type Leads',
  },
  {
    id: 10,
    path: '/employee-next-appointment',
    component: <EmpFollowupTypeLeads mode="next_appointment" />,
    navItem: 'Next Appointment Leads',
  },
  {
    id: 10,
    path: '/employee-status/:slug',
    component: <EmpFollowupTypeLeads mode="status" />,
    navItem: 'Status Leads',
  },

  {
    id: 11,
    path: '/users',
    component: <LoginAsEmployee />,
    navItem: 'Users',
  },

];

// UpdatePermissions
