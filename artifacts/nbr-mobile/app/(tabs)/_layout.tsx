// The (tabs) group is kept for routing compatibility.
// All game UI lives in app/(game)/. Redirect here.
import { Redirect } from 'expo-router';
export default function TabsLayout() {
  return <Redirect href="/(game)/lobby" />;
}
