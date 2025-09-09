import { registerRootComponent } from 'expo';
import App from './App';
import TrackPlayer from 'react-native-track-player';

// Register the playback service.
TrackPlayer.registerPlaybackService(() => require('./service'));

registerRootComponent(App);
