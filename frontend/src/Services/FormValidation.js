import * as Yup from "yup";
export const playerRegistrationSchema = Yup.object().shape({
  referral_user_id: Yup.string().required("Referral is mandatory"),
  full_name: Yup.string().required("Full name is required"),
  password: Yup.string()
    .min(3, "Password must be 3 characters at minimum")
    .required("Password is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, {
      message:
        "Invalid mobile number format. It must be a 10-digit number without dots.",
    })
    .test(
      "no-dots",
      "Dots are not allowed in the mobile number.",
      (value) => !/\./.test(value)
    )
    .required("Mobile number is required"),
  email: Yup.string()
    .email("Invalid email address format")
    .required("Email is required"),
  username: Yup.string().required("User id is required field"),
});

export const changePasswordSchema = Yup.object().shape({
  oldpass: Yup.string()
    .min(3, "Password must be 3 characters at minimum")
    .required("Password is required"),
  newpass: Yup.string()
    .min(3, "Password must be 3 characters at minimum")
    .required("Password is required"),
  email: Yup.string()
    .email("Invalid email address format")
    .required("Email is required"),
});

export const subAdminRegistrationSchema = Yup.object().shape({
  sub_admin_name: Yup.string().required("Name is mandatory"),
  sub_admin_login_id: Yup.string().required("Login Id is required"),
  sub_admin_password: Yup.string()
    .min(3, "Password must be 3 characters at minimum")
    .required("Password is required"),
  sub_admin_contact_no: Yup.string()
    .matches(/^[0-9]{10}$/, {
      message:
        "Invalid mobile number format. It must be a 10-digit number without dots.",
    })
    .test(
      "no-dots",
      "Dots are not allowed in the mobile number.",
      (value) => !/\./.test(value)
    )
    .required("Mobile number is required"),
  sub_admin_email: Yup.string()
    .email("Invalid email address format")
    .required("Email is required"),
});

export const signupSchemaValidataon = Yup.object().shape({
  pass: Yup.string()
    .min(3, "Password must be 3 characters at minimum")
    .required("Password is required"),
  confirmpass: Yup.string()
    .min(3, "Password must be 3 characters at minimum")
    .required("Password is required"),
    l_name: Yup.string()
    .required("Last Name is required"),
    f_name: Yup.string()
    .required("First Name is required"),
  mobile: Yup.string()
    .matches(
      /^[0-9]{10}$/,
      "Invalid mobile number format. It must be a 10-digit number."
    )
    .required("Mobile number is required"),
  email: Yup.string()
    .email("Invalid email address format")
    .required("Email is required"),
});

export const ipvalidationSchema = Yup.object().shape({
  domain_ip: Yup.string()
    .matches(
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "Invalid IP address format"
    )
    .required("Domain IP is required"),
  domain_url: Yup.string()
    .url("Invalid URL format")
    .required("Domain URL is required"),
});