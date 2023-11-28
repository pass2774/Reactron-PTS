
import React, { useState, useEffect } from 'react';


const Element = ({ title, children }) => {
  return (
    <div className="flex flex-col items-center p-[1rem] bg-[white] border-[#F5F5FA] border-[0.15rem] rounded-xl shadow-md mx-[0.5rem]">
      {title ? <div className="text-3xl font-bold">{title}</div> : null}
      <div className="w-full mt-[0.5rem]">
        {children}
      </div>
    </div>
  );
};


const CustomButton = ({ title, onClick, isButtonEnabled = true, themeColor, size = undefined }) => {
  const [isButtonDisabled, setButtonDisabled] = useState(false);
  const handleClickHysteresis = () => {
    onClick();
    setButtonDisabled(true);
    setTimeout(() => {
      setButtonDisabled(false);
    }, 3000);
  };

  useEffect(() => {
    // Cleanup: Make sure to enable the button when the component unmounts
    return () => {
      setButtonDisabled(false);
    };
  }, []);

  //let a = '10rem'

  return (
    <>
      {size ?
        <button
          onClick={handleClickHysteresis}
          disabled={!isButtonEnabled || isButtonDisabled}
          className={`${size} font-bold py-2 px-4 rounded text-white
              ${themeColor === 'darkblue'
              ? 'bg-blue-900 hover:bg-blue-700'
              : themeColor === 'red'
                ? 'bg-red-500 hover:bg-red-700'
                : 'bg-blue-500 hover:bg-blue-700'}
        
              ${(!isButtonEnabled || isButtonDisabled) ? 'opacity-20 cursor-not-allowed' : ''}
              `}
        >
          {title}
        </button>
        :
        <button
          onClick={handleClickHysteresis}
          disabled={!isButtonEnabled || isButtonDisabled}
          className={`w-[10rem] h-[5rem] font-bold py-2 px-4 rounded text-white
        ${themeColor === 'darkblue'
              ? 'bg-blue-900 hover:bg-blue-700'
              : themeColor === 'red'
                ? 'bg-red-500 hover:bg-red-700'
                : 'bg-blue-500 hover:bg-blue-700'}
  
        ${(!isButtonEnabled || isButtonDisabled) ? 'opacity-20 cursor-not-allowed' : ''}
        `}
        >
          {title}
        </button>}
    </>
  );
};

const SectionLevel1 = ({ title, children }) => {

  return (
    <div className="flex flex-col items-center p-[1rem] bg-[white] border-[#F5F5FA] border-[0.15rem] rounded-xl shadow-md mx-[0.5rem]">
      {title ? <div className="text-3xl font-bold">{title}</div> : null}
      <div className="w-full mt-[0.5rem]">
        {children}
      </div>
    </div>
  );
};


const SectionLevel2 = ({ title, children, enable = true, ...props }) => {

  return (
    <div className={`flex flex-col items-center mx-[0.5rem] ${props.className}`}>
      <div className={`drop-shadow-md w-full flex justify-start items-center`}>
        <div className="mr-[0.5rem] text-lg font-bold whitespace-pre">{title}</div>
        <div className="w-full h-[2px] bg-black rounded-full"></div>
      </div>
      <div className={`w-full mt-[0.5rem] ${enable === true ? "" : "opacity-30"}`}>
        {children}
      </div>
    </div>
  );
};



const FieldSelector = ({ field, children, color }) => {
  return (
    <div className="w-fit h-[1.8rem] flex rounded-sm my-[0.2rem]">
      <div className="w-[8rem] h-full text-md text-start truncate font-bold">{field}</div>
      <div className="w-[1rem] h-full font-bold">:</div>
      <div className="w-[14rem] text-md font-bold">{children}</div>
    </div>
  );
};

const FieldInput = ({ field, input, width, onChange }) => {
  const widthInput = width ? width : "10rem";

  return (
    <div className="w-fit h-[1.8rem] flex rounded-sm my-[0.2rem]">
      <div className="w-[8rem] h-full text-md text-start truncate font-bold">{field}</div>
      <div className="w-[1rem] h-full font-bold">:</div>
      {/* <input className="w-[12rem] h-full text-md text-start font-bold shadow-sm border border-1 border-[#CCF] rounded-lg px-[1rem] bg-[#FAFAFA]" type="text" id="fname" name="fname" value={input} /> */}
      <input className={`w-[${widthInput}] h-full text-md text-start font-bold shadow-sm border border-1 border-[#CCF] rounded-lg px-[1rem] bg-[#FAFAFA]`} onChange={onChange} type="text" id="fname" name="fname" value={input} />
    </div>
  );
};


const FieldText = ({ field, content, color }) => {
  return (
    <div className="w-fit h-[1.8rem] flex justify-start rounded-sm my-[0.2rem]">
      <div
        className="w-[8rem] h-full text-md text-start truncate font-bold">{field}</div>
      <div className="w-[1rem] h-full font-bold">:</div>
      <div className="w-[10rem] h-full ml-[1rem] text-md text-start rounded-sm"> {content}</div>
    </div>
  );
};


const RobotModeIndicatorSection = ({ status }) => {
  let indicators = [
    { title: "Power Off", color: "#AAA" },
    { title: "Booting", color: "#AAA" },
    { title: "Robot\nActive", color: "#AAA" },
    { title: "Releasing\nBrake", color: "#AAA" },
    { title: "Robot\nOperational", color: "#AAA" },
  ];

  if (status === 1) {
    indicators[0].color = "#F00";
  } else if (status === 2) {
    indicators[0].color = "#0F0";
  } else if (status === 3) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#FF0";
  } else if (status === 4) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#0F0";
    indicators[2].color = "#FF0";
  } else if (status === 5) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#0F0";
    indicators[2].color = "#0F0";
    indicators[3].color = "#FF0";
  } else if (status === 6) {
    indicators[0].color = "#0F0";
    indicators[1].color = "#0F0";
    indicators[2].color = "#0F0";
    indicators[3].color = "#0F0";
    indicators[4].color = "#0F0";
  }


  return (
    <div className="flex w-full justify-center">
      {
        indicators.map(item => {
          return (
            <LedIndicator text={item.title} color={item.color} />
          )
        })
      }
    </div>
  );
}

const LedIndicator = ({ text, color, arg = 'w-[6rem]' }) => {
  const bgColor = Array.isArray(color) ? color[0] : color;

  return (
    <div className={`${arg} flex flex-col items-center`}>
      <div
        style={{ backgroundColor: bgColor }}
        className="rounded-full shadow-md w-[3rem] h-[3rem]"
      ></div>
      <div className="text-md font-bold w-full whitespace-pre">{text}</div>
    </div>
  );
};


export {
  CustomButton,
  SectionLevel1,
  SectionLevel2,
  FieldSelector,
  FieldInput,
  FieldText,
  RobotModeIndicatorSection,
  LedIndicator
};