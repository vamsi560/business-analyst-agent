import React from 'react';

const ValueMomentumLogo = ({ className = "w-16 h-16", textColor = "#000000", triangleColor = "#EF4444" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 400 100" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* VALUE text */}
        <text 
          x="20" 
          y="65" 
          fontSize="24" 
          fontWeight="300" 
          fill={textColor}
          fontFamily="Arial, sans-serif"
          textAnchor="start"
        >
          VALUE
        </text>
        
        {/* Large M */}
        <text 
          x="200" 
          y="75" 
          fontSize="48" 
          fontWeight="bold" 
          fill={textColor}
          fontFamily="Arial, sans-serif"
          textAnchor="middle"
        >
          M
        </text>
        
        {/* OMENTUM text */}
        <text 
          x="280" 
          y="65" 
          fontSize="24" 
          fontWeight="300" 
          fill={textColor}
          fontFamily="Arial, sans-serif"
          textAnchor="start"
        >
          OMENTUM
        </text>
        
        {/* Upper spiral triangles */}
        <g>
          {/* Top-left spiral */}
          <polygon 
            points="180,45 185,50 180,55" 
            fill={triangleColor}
          />
          <polygon 
            points="190,40 195,45 190,50" 
            fill={triangleColor}
          />
          <polygon 
            points="200,35 205,40 200,45" 
            fill={triangleColor}
          />
          <polygon 
            points="210,30 215,35 210,40" 
            fill={triangleColor}
          />
          <polygon 
            points="220,25 225,30 220,35" 
            fill={triangleColor}
          />
          <polygon 
            points="230,20 235,25 230,30" 
            fill={triangleColor}
          />
          <polygon 
            points="240,15 245,20 240,25" 
            fill={triangleColor}
          />
          <polygon 
            points="250,10 255,15 250,20" 
            fill={triangleColor}
          />
          <polygon 
            points="260,5 265,10 260,15" 
            fill={triangleColor}
          />
          <polygon 
            points="270,0 275,5 270,10" 
            fill={triangleColor}
          />
          <polygon 
            points="280,-5 285,0 280,5" 
            fill={triangleColor}
          />
          <polygon 
            points="290,-10 295,-5 290,0" 
            fill={triangleColor}
          />
          <polygon 
            points="300,-15 305,-10 300,-5" 
            fill={triangleColor}
          />
          <polygon 
            points="310,-20 315,-15 310,-10" 
            fill={triangleColor}
          />
          <polygon 
            points="320,-25 325,-20 320,-15" 
            fill={triangleColor}
          />
          <polygon 
            points="330,-30 335,-25 330,-20" 
            fill={triangleColor}
          />
          <polygon 
            points="340,-35 345,-30 340,-25" 
            fill={triangleColor}
          />
          <polygon 
            points="350,-40 355,-35 350,-30" 
            fill={triangleColor}
          />
          <polygon 
            points="360,-45 365,-40 360,-35" 
            fill={triangleColor}
          />
          <polygon 
            points="370,-50 375,-45 370,-40" 
            fill={triangleColor}
          />
          <polygon 
            points="380,-55 385,-50 380,-45" 
            fill={triangleColor}
          />
        </g>
        
        {/* Lower spiral triangles */}
        <g>
          {/* Bottom-left spiral */}
          <polygon 
            points="180,55 185,60 180,65" 
            fill={triangleColor}
          />
          <polygon 
            points="190,60 195,65 190,70" 
            fill={triangleColor}
          />
          <polygon 
            points="200,65 205,70 200,75" 
            fill={triangleColor}
          />
          <polygon 
            points="210,70 215,75 210,80" 
            fill={triangleColor}
          />
          <polygon 
            points="220,75 225,80 220,85" 
            fill={triangleColor}
          />
          <polygon 
            points="230,80 235,85 230,90" 
            fill={triangleColor}
          />
          <polygon 
            points="240,85 245,90 240,95" 
            fill={triangleColor}
          />
          <polygon 
            points="250,90 255,95 250,100" 
            fill={triangleColor}
          />
          <polygon 
            points="260,95 265,100 260,105" 
            fill={triangleColor}
          />
          <polygon 
            points="270,100 275,105 270,110" 
            fill={triangleColor}
          />
          <polygon 
            points="280,105 285,110 280,115" 
            fill={triangleColor}
          />
          <polygon 
            points="290,110 295,115 290,120" 
            fill={triangleColor}
          />
          <polygon 
            points="300,115 305,120 300,125" 
            fill={triangleColor}
          />
          <polygon 
            points="310,120 315,125 310,130" 
            fill={triangleColor}
          />
          <polygon 
            points="320,125 325,130 320,135" 
            fill={triangleColor}
          />
          <polygon 
            points="330,130 335,135 330,140" 
            fill={triangleColor}
          />
          <polygon 
            points="340,135 345,140 340,145" 
            fill={triangleColor}
          />
          <polygon 
            points="350,140 355,145 350,150" 
            fill={triangleColor}
          />
          <polygon 
            points="360,145 365,150 360,155" 
            fill={triangleColor}
          />
          <polygon 
            points="370,150 375,155 370,160" 
            fill={triangleColor}
          />
          <polygon 
            points="380,155 385,160 380,165" 
            fill={triangleColor}
          />
        </g>
      </svg>
    </div>
  );
};

export default ValueMomentumLogo;
