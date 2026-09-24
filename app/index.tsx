import { Redirect } from 'expo-router';

/** Root entry point: route initial launch to Splash screen (drop logo). */
export default function IndexScreen() {
  return <Redirect href="/splash" />;
}

