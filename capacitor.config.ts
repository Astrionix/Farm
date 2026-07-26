import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mahalakshmi.poultryerp',
  appName: 'FlockMind AI',
  webDir: 'out',
  server: {
    url: 'https://farm-lac-theta.vercel.app',
    androidScheme: 'https',
    hostname: 'farm-lac-theta.vercel.app',
    cleartext: false
  }
};

export default config;
