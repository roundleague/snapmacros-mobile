import { createStackNavigator } from '@react-navigation/stack';
import LogChoice from '../screens/LogChoice';
import LogMeal from '../screens/LogMeal';
import LogExercise from '../screens/LogExercise';

export type LogStackParamList = {
  LogChoice: undefined;
  LogMeal: undefined;
  LogExercise: undefined;
};

const Stack = createStackNavigator<LogStackParamList>();

export default function LogStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LogChoice" component={LogChoice} />
      <Stack.Screen name="LogMeal" component={LogMeal} />
      <Stack.Screen name="LogExercise" component={LogExercise} />
    </Stack.Navigator>
  );
}
