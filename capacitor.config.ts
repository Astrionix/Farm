import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mahalakshmi.poultryerp',
  appName: 'FlockMind AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'farm-lac-theta.vercel.app'
  }
};

export default config;
