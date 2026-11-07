import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'app-icon' | 'glyph' | 'color' | 'white';
}

/**
 * Official Apple Health (HealthKit) Logo
 *
 * Implements Apple's official Health app brand iconography:
 * - 'app-icon': The official iOS Health App rounded squircle with the signature coral/pink gradient heart
 * - 'glyph': Standalone Apple Health coral/pink gradient heart vector
 */
export const AppleHealthLogo: React.FC<LogoProps> = ({
  className = 'w-7 h-7',
  variant = 'app-icon',
}) => {
  if (variant === 'glyph') {
    return (
      <svg
        viewBox="0 0 240 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Apple Health Logo"
      >
        <defs>
          <linearGradient id="appleHealthGlyphGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5DA2" />
            <stop offset="35%" stopColor="#FF2D55" />
            <stop offset="100%" stopColor="#FF3B30" />
          </linearGradient>
        </defs>
        <path
          fill="url(#appleHealthGlyphGrad)"
          d="M 61.0 0.3 L 68.7 0.3 L 76.5 0.8 L 84.2 2.1 L 91.9 4.3 L 99.6 7.7 L 107.4 12.8 L 115.1 19.0 L 122.8 19.8 L 130.6 13.6 L 138.3 8.5 L 146.0 4.8 L 153.7 2.4 L 161.5 0.8 L 169.2 0.3 L 176.9 0.3 L 184.6 1.1 L 192.4 2.9 L 200.1 5.6 L 207.8 9.6 L 215.6 15.5 L 222.7 23.0 L 228.3 30.7 L 232.6 38.4 L 235.5 46.2 L 237.7 53.9 L 238.7 61.7 L 238.7 69.4 L 238.5 77.1 L 237.1 84.9 L 235.3 92.6 L 232.6 100.4 L 229.4 108.1 L 225.7 115.8 L 221.4 123.6 L 216.6 131.3 L 211.3 139.1 L 205.2 146.8 L 198.0 154.5 L 190.2 162.0 L 182.5 169.0 L 174.8 175.4 L 167.1 181.2 L 159.3 186.8 L 151.6 192.5 L 143.9 197.3 L 136.2 202.1 L 128.4 206.1 L 120.7 208.7 L 113.0 207.1 L 105.2 203.1 L 97.5 198.9 L 89.8 193.8 L 82.1 188.7 L 74.3 183.1 L 66.6 177.2 L 58.9 170.8 L 51.2 164.2 L 43.4 157.0 L 36.2 149.2 L 29.6 141.5 L 24.0 133.7 L 18.9 126.0 L 14.7 118.2 L 10.7 110.5 L 7.5 102.8 L 4.5 95.0 L 2.4 87.3 L 1.1 79.5 L 0.3 71.8 L 0.3 64.1 L 1.1 56.3 L 2.7 48.6 L 5.6 40.8 L 9.3 33.1 L 14.4 25.4 L 21.3 17.6 L 29.0 11.2 L 36.8 6.7 L 44.5 3.5 L 52.2 1.6 L 59.9 0.5 Z"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Apple Health App Icon"
    >
      <defs>
        <linearGradient id="appleHealthIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF5DA2" />
          <stop offset="35%" stopColor="#FF2D55" />
          <stop offset="100%" stopColor="#FF3B30" />
        </linearGradient>
      </defs>

      {/* iOS App Squircle */}
      <rect width="512" height="512" rx="115" fill="#FFFFFF" />

      {/* Official Top-Right Apple Health Heart */}
      <path
        fill="url(#appleHealthIconGrad)"
        d="M 254.0 84.3 L 261.7 84.3 L 269.5 84.8 L 277.2 86.1 L 284.9 88.3 L 292.6 91.7 L 300.4 96.8 L 308.1 103.0 L 315.8 103.8 L 323.6 97.6 L 331.3 92.5 L 339.0 88.8 L 346.7 86.4 L 354.5 84.8 L 362.2 84.3 L 369.9 84.3 L 377.6 85.1 L 385.4 86.9 L 393.1 89.6 L 400.8 93.6 L 408.6 99.5 L 415.7 107.0 L 421.3 114.7 L 425.6 122.4 L 428.5 130.2 L 430.7 137.9 L 431.7 145.7 L 431.7 153.4 L 431.5 161.1 L 430.1 168.9 L 428.3 176.6 L 425.6 184.4 L 422.4 192.1 L 418.7 199.8 L 414.4 207.6 L 409.6 215.3 L 404.3 223.1 L 398.2 230.8 L 391.0 238.5 L 383.2 246.0 L 375.5 253.0 L 367.8 259.4 L 360.1 265.2 L 352.3 270.8 L 344.6 276.5 L 336.9 281.3 L 329.2 286.1 L 321.4 290.1 L 313.7 292.7 L 306.0 291.1 L 298.2 287.1 L 290.5 282.9 L 282.8 277.8 L 275.1 272.7 L 267.3 267.1 L 259.6 261.2 L 251.9 254.8 L 244.2 248.2 L 236.4 241.0 L 229.2 233.2 L 222.6 225.5 L 217.0 217.7 L 211.9 210.0 L 207.7 202.2 L 203.7 194.5 L 200.5 186.8 L 197.5 179.0 L 195.4 171.3 L 194.1 163.5 L 193.3 155.8 L 193.3 148.1 L 194.1 140.3 L 195.7 132.6 L 198.6 124.8 L 202.3 117.1 L 207.4 109.4 L 214.3 101.6 L 222.0 95.2 L 229.8 90.7 L 237.5 87.5 L 245.2 85.6 L 252.9 84.5 Z"
      />
    </svg>
  );
};

/**
 * Official Google Health Connect by Android Logo
 *
 * Implements Android's official Health Connect interlocking loops geometry:
 * - 'color': Google Blue (#4285F4) and Android Cyan (#38BDF8) / Dark Teal (#003144)
 * - 'app-icon': Rendered on a clean white circular/squircle container (Google Play style)
 * - 'white': Monochromatic white for high-contrast dark buttons
 */
export const GoogleHealthConnectLogo: React.FC<LogoProps> = ({
  className = 'w-7 h-7',
  variant = 'color',
}) => {
  if (variant === 'white') {
    return (
      <svg
        viewBox="0 0 104 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Google Health Connect Logo"
      >
        <path
          fill="#FFFFFF"
          fillRule="evenodd"
          d="M61.478 50.49 45.06 34.072c-5.244-5.244-13.745-5.244-18.988 0-5.244 5.243-5.244 13.745 0 18.988L42.49 69.48c5.244 5.243 13.745 5.243 18.989 0 5.243-5.244 5.243-13.745 0-18.989ZM17.783 25.783c-9.821 9.821-9.821 25.745 0 35.566L34.2 77.767c9.822 9.822 25.745 9.822 35.566 0 9.821-9.821 9.821-25.744 0-35.566L53.35 25.783c-9.821-9.821-25.745-9.821-35.566 0Z"
          clipRule="evenodd"
        />
        <path
          fill="#FFFFFF"
          fillRule="evenodd"
          d="M61.51 69.572 77.93 53.153c5.243-5.243 5.243-13.745 0-18.989-5.244-5.243-13.745-5.243-18.989 0L42.522 50.584c-5.244 5.244-5.244 13.745 0 18.989 5.243 5.243 13.745 5.243 18.988 0Zm24.707-43.696c-9.821-9.821-25.744-9.821-35.566 0L34.233 42.294c-9.821 9.822-9.821 25.745 0 35.566 9.821 9.821 25.745 9.821 35.566 0l16.418-16.418c9.822-9.822 9.822-25.745 0-35.566Z"
          clipRule="evenodd"
        />
        <path
          fill="#FFFFFF"
          d="M77.365 44.265a9.524 9.524 0 0 1-9.524 9.524 9.524 9.524 0 1 1 0-19.048 9.524 9.524 0 0 1 9.524 9.524Z"
        />
      </svg>
    );
  }

  if (variant === 'app-icon') {
    return (
      <svg
        viewBox="0 0 104 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Google Health Connect App Icon"
      >
        {/* Play Store / Android Round Squircle Container */}
        <rect width="104" height="104" rx="24" fill="#FFFFFF" />
        <g transform="translate(6, 6) scale(0.884)">
          <path
            fill="#003144"
            fillRule="evenodd"
            d="M61.478 50.49 45.06 34.072c-5.244-5.244-13.745-5.244-18.988 0-5.244 5.243-5.244 13.745 0 18.988L42.49 69.48c5.244 5.243 13.745 5.243 18.989 0 5.243-5.244 5.243-13.745 0-18.989ZM17.783 25.783c-9.821 9.821-9.821 25.745 0 35.566L34.2 77.767c9.822 9.822 25.745 9.822 35.566 0 9.821-9.821 9.821-25.744 0-35.566L53.35 25.783c-9.821-9.821-25.745-9.821-35.566 0Z"
            clipRule="evenodd"
          />
          <path
            fill="#4285F4"
            fillRule="evenodd"
            d="M61.51 69.572 77.93 53.153c5.243-5.243 5.243-13.745 0-18.989-5.244-5.243-13.745-5.243-18.989 0L42.522 50.584c-5.244 5.244-5.244 13.745 0 18.989 5.243 5.243 13.745 5.243 18.988 0Zm24.707-43.696c-9.821-9.821-25.744-9.821-35.566 0L34.233 42.294c-9.821 9.822-9.821 25.745 0 35.566 9.821 9.821 25.745 9.821 35.566 0l16.418-16.418c9.822-9.822 9.822-25.745 0-35.566Z"
            clipRule="evenodd"
          />
          <path
            fill="#4285F4"
            d="M77.365 44.265a9.524 9.524 0 0 1-9.524 9.524 9.524 9.524 0 1 1 0-19.048 9.524 9.524 0 0 1 9.524 9.524Z"
          />
        </g>
      </svg>
    );
  }

  // Default 'color' standalone vector (with cyan/blue contrast suitable for light & dark themes)
  return (
    <svg
      viewBox="0 0 104 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Health Connect Logo"
    >
      <path
        fill="#38BDF8"
        fillRule="evenodd"
        d="M61.478 50.49 45.06 34.072c-5.244-5.244-13.745-5.244-18.988 0-5.244 5.243-5.244 13.745 0 18.988L42.49 69.48c5.244 5.243 13.745 5.243 18.989 0 5.243-5.244 5.243-13.745 0-18.989ZM17.783 25.783c-9.821 9.821-9.821 25.745 0 35.566L34.2 77.767c9.822 9.822 25.745 9.822 35.566 0 9.821-9.821 9.821-25.744 0-35.566L53.35 25.783c-9.821-9.821-25.745-9.821-35.566 0Z"
        clipRule="evenodd"
      />
      <path
        fill="#4285F4"
        fillRule="evenodd"
        d="M61.51 69.572 77.93 53.153c5.243-5.243 5.243-13.745 0-18.989-5.244-5.243-13.745-5.243-18.989 0L42.522 50.584c-5.244 5.244-5.244 13.745 0 18.989 5.243 5.243 13.745 5.243 18.988 0Zm24.707-43.696c-9.821-9.821-25.744-9.821-35.566 0L34.233 42.294c-9.821 9.822-9.821 25.745 0 35.566 9.821 9.821 25.745 9.821 35.566 0l16.418-16.418c9.822-9.822 9.822-25.745 0-35.566Z"
        clipRule="evenodd"
      />
      <path
        fill="#4285F4"
        d="M77.365 44.265a9.524 9.524 0 0 1-9.524 9.524 9.524 9.524 0 1 1 0-19.048 9.524 9.524 0 0 1 9.524 9.524Z"
      />
    </svg>
  );
};
