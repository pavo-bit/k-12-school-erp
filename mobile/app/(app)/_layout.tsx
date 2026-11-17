import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="students" options={{ title: "Students" }} />
      <Stack.Screen name="fees" options={{ title: "Fees" }} />
      <Stack.Screen name="attendance" options={{ title: "Attendance" }} />
    </Stack>
  );
}
