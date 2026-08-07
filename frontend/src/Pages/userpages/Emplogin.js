import { useFormik } from 'formik';
import React, { useState } from 'react';
import { AiFillLock, AiOutlineMail } from 'react-icons/ai';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Col, Container } from 'react-bootstrap';
import { Row } from 'react-bootstrap';
import loginlogo from '../../Assets/logo.png';

const EmployeeLogIn = () => {
  const [loding, setloding] = useState(false);
  const navigate = useNavigate();
  const initialValue = {
    username: '',
    password: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
    onSubmit: () => {
      const reqBody = {
        username: fk.values.username,
        password: fk.values.password,
      };
      loginFunction(reqBody);
    },
  });

  const loginFunction = async (reqBody) => {
    setloding(true);
    try {
      const response = await axiosInstance.post(API_URLS.emp_login, reqBody);
      toast(response?.data?.msg);
      if (response?.data?.msg === 'Login Successfully') {
        const token = response?.data?.response?.[0]?.token;
        const empName = response?.data?.response?.[0]?.emp_name;
        localStorage.setItem('token', token);
        localStorage.setItem('user_role', 'employee');
        localStorage.setItem('name', empName || '');
        navigate('/employee-dashboard');
      }
    } catch (e) {
      console.log(e);
    } finally {
      setloding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <CustomCircularProgress isLoading={loding} />
      <Container>
        <div className="login_main_page">
          <Row>
            <Col xl={6} lg={6} md={6} sm={12} xs={12} className="d-md-block d-none">
              <div className="login_left_side">
                <div className="login_logo">
                  <div className="logo">
                    <img src={loginlogo} alt="logo" />
                  </div>
                  <div>
                    <b>Global-H-Cube Services</b>
                    <span>Member portal</span>
                  </div>
                </div>
                <div className="headline">
                  <h1>One <em>परिवार</em>,<br />One Login.</h1>
                  <p>Check your member profile, contributions and family records in one place. Sign in with the member ID your branch office gave you.</p>
                </div>
                <ul className="points">
                  <li><span className="tick"><svg viewBox="0 0 24 24"><path d="M4 12.5 9 17.5 20 6.5"></path></svg></span>See your contribution history and receipts</li>
                  <li><span className="tick"><svg viewBox="0 0 24 24"><path d="M4 12.5 9 17.5 20 6.5"></path></svg></span>Update address and mobile number yourself</li>
                  <li><span className="tick"><svg viewBox="0 0 24 24"><path d="M4 12.5 9 17.5 20 6.5"></path></svg></span>Get notices from your branch before anyone else</li>
                </ul>
                <div className="stat-strip">
                  <div className="stat"><b>24,600+</b><span>Members</span></div>
                  <div className="stat"><b>118</b><span>Branches</span></div>
                  <div className="stat"><b>19</b><span>States</span></div>
                </div>
              </div>
            </Col>
            <Col xl={6} lg={6} md={6} sm={12} xs={12} >
              <div className="login_right_side">
                <div className="login_logo  d-md-none d-flex">
                  <div className="logo">
                    <img src={loginlogo} alt="logo" />
                  </div>
                  <div>
                    <b>Global-H-Cube Services</b>
                    <span>Member portal</span>
                  </div>
                </div>
                <div class="panel-head">
                  <h2>Sign in to your account</h2>
                  <p>Use your member ID or registered email address.</p>
                </div>
                <form onSubmit={fk.handleSubmit} className="space-y-6">
                  <div className="field">
                    <label>Member ID or email</label>
                    <div className="input-groups">
                      <svg viewBox="0 0 24 24"><path d="M20 7H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Z"/><path d="m3.5 8 8.5 6 8.5-6"/></svg>
                      <input type="text" name="username" value={fk.values.username} onChange={fk.handleChange} placeholder="Enter your username" />
                    </div>
                  </div>

                  <div className="field">
                    <label> Password</label>
                    <div className="input-groups">
                      <svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>
                      <input type="password" name="password" value={fk.values.password} onChange={fk.handleChange} placeholder="Enter your password"/>
                    </div>
                  </div>

                  <div className="check_row">
                    <label className="check"><input type="checkbox" /> Keep me signed in</label>
                    <a className="link" href="#">Forgot password?</a>
                  </div>

                  <button type="submit" className="submit">Login Now</button>
                </form>
                <aside className="helper">
                  <div className="icon">
                    <svg viewBox="0 0 24 24"><path d="M12 17v.01"/><path d="M9.5 9a2.6 2.6 0 0 1 5 1c0 1.7-2.5 2-2.5 3.5"/><circle cx="12" cy="12" r="9"/></svg>
                  </div>
                  <div>
                    <h3>Don't have a member ID yet?</h3>
                    <p>New members are registered at the branch office. Ask your branch secretary, or call the helpline on <a href="tel:18001234567">1800 123 4567</a> (9 AM – 6 PM, Mon–Sat).</p>
                  </div>
                </aside>
                <div className="foot">
                  <span className="secure"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v6c0 4.2 2.9 7.8 7 9 4.1-1.2 7-4.8 7-9V6l-7-3Z"/></svg> Encrypted connection</span>
                  <span>© 2026 Global-H-Cube Services</span>
                </div>
              </div>
            </Col>
          </Row>
        </div>

      </Container>
    </div>
  );
};

export default EmployeeLogIn;