//SplashScreen.tsx

import React, { useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/NavigationType';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  // Get the width of the device to determine if it's a tablet
  const { width } = Dimensions.get('window');
  const isTablet = width >= 768;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('BaseHome'); // Correct navigation to MainApp stack
    }, 5000); // Delay for 9 seconds

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ImageBackground
      source={isTablet 
        ? require('../assets/HolisticAwakeningSplashIpad.gif')
        : require('../assets/HolisticAwakeningSplash.gif')}
      style={styles.background}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;
