import { Notifications } from '@mui/icons-material';
import { Avatar, IconButton } from '@mui/material';
import { IoColorPalette } from 'react-icons/io5';
import { useMediaQuery } from 'react-responsive';
import BreadCrumbs from '../Shared/BreadCrumbs';
import CustomDialogBox from '../Shared/CustomDialogBox';
import { useEffect, useState } from 'react';
import Sidebar from '../Shared/Sidebar';
import MobileNavigation from '../Shared/Sidebar/MobileNavigation';
import avtaar from '../Assets/avt.jpg';
const Layout = ({ component, navItem, navLink, id }) => {
  const isMediumScreen = useMediaQuery({ maxWidth: 1000 });
  // Set when an admin uses "Login as Employee" (see LoginAsEmployee.js) — lets
  // them get back to their own account instead of getting force-logged-out
  // the moment they hit an admin-only API while still holding the employee token.
  const isImpersonating = !!sessionStorage.getItem('admin_token_backup');
  const handleReturnToAdmin = () => {
    const adminToken = sessionStorage.getItem('admin_token_backup');
    if (!adminToken) return;
    const adminName = sessionStorage.getItem('admin_name_backup') || '';
    localStorage.setItem('token', adminToken);
    localStorage.setItem('name', adminName);
    localStorage.removeItem('user_role');
    sessionStorage.removeItem('admin_token_backup');
    sessionStorage.removeItem('admin_name_backup');
    window.location.href = '/dashboard';
  };
  const usertype = localStorage.getItem('user_type');
  const user_name = localStorage.getItem('name');
  const user_mobile = localStorage.getItem('mobile');
  const user = localStorage.getItem('erp_username');
  const background = localStorage.getItem('background_url');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [color, setcolor] = useState(
    background ||
      'https://aaraerp.s3.amazonaws.com/media/background_image/background4_VxrVIay_02MDQXY_J8Ld4WR.webp'
  );
  // const user1 = localStorage.getItem("role_user");
  const [openCustomDialogBox, setopenCustomDialogBox] = useState(false);
  const colorsData = [
    {
      HEX: 'https://aaraerp.s3.amazonaws.com/media/background_image/background4_VxrVIay_02MDQXY_J8Ld4WR.webp',
    },
    {
      HEX: 'https://images.unsplash.com/photo-1614850523060-8da1d56ae167?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGlnaHQlMjBjb2xvdXJ8ZW58MHx8MHx8fDA%3D',
    },
    {
      HEX: 'https://dm0qx8t0i9gc9.cloudfront.net/watermarks/image/rDtN98Qoishumwih/nature-theme-background_MJviyZ9d_SB_PM.jpg',
    },
    {
      HEX: 'https://wallpapers.com/images/hd/light-color-pink-and-blue-background-8zrww1yggwb8mbh3.jpg',
    },
    {
      HEX: 'https://wallpapers.com/images/hd/laptop-lock-screen-8r4ntp5agah1y579.jpg',
    },
    {
      HEX: 'https://wallpaper.forfun.com/fetch/a8/a81b19c83d77ea9e48fd5e92d7705f38.jpeg',
    },
    {
      HEX: 'https://cdn.neowin.com/news/images/uploaded/2023/11/1699098103_windows_10_and_windows_11_story.jpg',
    },
    {
      HEX: 'https://preview.redd.it/lobabzkewaf91.jpg?width=640&crop=smart&auto=webp&s=c7d5e001fd1af54104fc1a169cf4a03699561695',
    },
    {
      HEX: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSk3QceFZDYBnNpGD94Opz6Fb_JQUhKfw3o9JRdXGMXgIQTfJVcTgG1GW9TDG7al2IjH4&usqp=CAU',
    },
    {
      HEX: 'https://tackexinh.com/wp-content/uploads/2020/09/hinh-win-10-don-gian-37-scaled.jpg',
    },
  ];

  // useEffect(() => {
  //   setuser_exist(user1);
  // }, [user1]);

  return (
    <div
      // style={{
      //   backgroundImage: `url(${color})`,
      //   backgroundSize: "cover",
      // }}
      className={` lg:flex lg:h-screen h-[110vh] !w-[100vw] !overflow-x-hidden`}
    >
      {!isMediumScreen ? <Sidebar /> : <MobileNavigation />}
      <div className="flex flex-col gap-3 h-screen lg:!w-[calc(100vw-16vw)] w-full !overflow-x-auto  ">
        {isImpersonating && (
          <div className="flex items-center justify-between w-full px-4 py-2 bg-amber-400 text-black text-sm font-semibold shadow-md">
            <span>
              You're viewing the app as{' '}
              <b>{user_name || 'an employee'}</b>.
            </span>
            <button
              onClick={handleReturnToAdmin}
              className="bg-black text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-800"
            >
              Return to Admin
            </button>
          </div>
        )}
       

        <div className="flex flex-col overflow-y-auto w-full lg:h-[89vh] !h-[100vh] glass  ">
          {component}
        </div>

        {!isMediumScreen && (
          <div className="flex footer_mrm  justify-end">
            <p>
              All Rights reserved to{' '}
              <span className="!font-bold">Global-H-Cube Services Lead Management Software 2026</span>
            </p>
          </div>
        )}
      </div>

      {openCustomDialogBox && (
        <CustomDialogBox
          openCustomDialogBox={openCustomDialogBox}
          setOpenCustomDialogBox={setopenCustomDialogBox}
          component={
            <div className="grid grid-cols-4 gap-4">
              {colorsData.map((i) => {
                return (
                  <div
                    className="!cursor-pointer"
                    onClick={() => {
                      localStorage.setItem('background_url', i?.HEX);
                      setcolor(i?.HEX);
                    }}
                  >
                    <img className="!h-32 !w-32" src={i?.HEX} />
                  </div>
                );
              })}
            </div>
          }
          title="Choose background"
        />
      )}
    </div>
  );
};

export default Layout;
