import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mahalakshmi.poultryerp',
  appName: 'FlockMind AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'flockmind.app'
  }
};

export default config;
