import React, { useState } from 'react';
import CustomCircularProgress from '../Shared/loder/CustomCircularProgress';
import scanner from '../Assets/Qrcode.png';
import { useNavigate } from 'react-router-dom';

const Qrgenerator = () => {
  const [loading, setloading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex pt-20 justify-center bg-gradient-to-br from-[#397EF3] via-[#060C95] to-[#00008B]">
      <CustomCircularProgress isLoading={loading} />
      <div className="flex flex-col gap-5">
        <img src={scanner} className="w-[320px] h-[300px]" />
        <p className="text-cyan-500 font-bold text-center text-xl rounded-md border border-purple-400 p-2">
          Scan QR Code
        </p>
        <div className="flex gap-2 ">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              className="w-12 h-12 text-center bg-gradient-to-br from-blue-200 to-purple-200 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>
        <button
          className="mt-4 px-6 py-2 bg-gradient-to-tr from-blue-500 to-purple-400  text-white text-lg font-semibold rounded-md transition"
          onClick={() => navigate('/dashboard')}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Qrgenerator;
